# backend/app.py

import os
import json
import tempfile
from typing import Annotated, List

import faiss
import numpy as np
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.auth import (
    create_jwt,
    get_current_user,
    verify_demo_credentials,
    verify_google_token,
)
from backend.models.schemas import (
    AskRequest,
    AskResponse,
    DocumentsResponse,
    UploadResponse,
)
from backend.rag_pipeline import (
    ask_llm_groq,
    ask_llm_groq_stream,
    build_prompt,
    chunk_text,
    detect_intent,
    extract_text_from_pdf,
    get_embeddings,
    get_summary_chunks,
    retrieve_chunks,
)

# ---------------------------------------------------------------------------
# Rate limiter — keyed by IP address
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)

# ---------------------------------------------------------------------------
# App + Middleware
# ---------------------------------------------------------------------------

app = FastAPI(title="NotesMind API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.environ.get("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Security constants
# ---------------------------------------------------------------------------

MAX_FILE_SIZE    = 10 * 1024 * 1024   # 10 MB
MAX_QUESTION_LEN = 2000               # characters
PDF_MAGIC_BYTES  = b"%PDF"            # first 4 bytes of every valid PDF

# ---------------------------------------------------------------------------
# Auth request models
# ---------------------------------------------------------------------------

class GoogleAuthRequest(BaseModel):
    id_token: str

class DemoAuthRequest(BaseModel):
    email: str
    password: str

class SelectRequest(BaseModel):
    document: str

# ---------------------------------------------------------------------------
# Vectorstore — per-document folder structure
# ---------------------------------------------------------------------------

VECTORSTORE_DIR = os.environ.get(
    "VECTORSTORE_DIR",
    os.path.join(os.path.dirname(__file__), "vectorstore")
)
ACTIVE_FILE = os.path.join(VECTORSTORE_DIR, "active.json")

_active_doc: str | None = None


def _save_active(doc_name: str | None) -> None:
    os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    tmp_path = ACTIVE_FILE + ".tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump({"active": doc_name}, f)
        os.replace(tmp_path, ACTIVE_FILE)
    except OSError:
        pass


def _load_active() -> str | None:
    try:
        with open(ACTIVE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("active")
    except (OSError, json.JSONDecodeError):
        return None


def _doc_dir(doc_name: str) -> str:
    safe_name = os.path.basename(doc_name)
    return os.path.join(VECTORSTORE_DIR, safe_name)


def _save_doc(doc_name: str, chunks: List[str], index: faiss.IndexFlatL2):
    folder = _doc_dir(doc_name)
    os.makedirs(folder, exist_ok=True)
    faiss.write_index(index, os.path.join(folder, "index.faiss"))
    with open(os.path.join(folder, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump({"chunks": chunks}, f)


def _load_doc(doc_name: str):
    folder = _doc_dir(doc_name)
    index_path  = os.path.join(folder, "index.faiss")
    chunks_path = os.path.join(folder, "chunks.json")
    if not os.path.exists(index_path) or not os.path.exists(chunks_path):
        return None, None
    index = faiss.read_index(index_path)
    with open(chunks_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["chunks"], index


def _list_docs() -> List[str]:
    if not os.path.exists(VECTORSTORE_DIR):
        return []
    docs = []
    for name in os.listdir(VECTORSTORE_DIR):
        folder = os.path.join(VECTORSTORE_DIR, name)
        if (
            os.path.isdir(folder)
            and os.path.exists(os.path.join(folder, "index.faiss"))
            and os.path.exists(os.path.join(folder, "chunks.json"))
        ):
            docs.append(name)
    return sorted(docs)


def _auto_select_first():
    global _active_doc
    if _active_doc is not None:
        return
    persisted = _load_active()
    docs = _list_docs()
    if persisted and persisted in docs:
        _active_doc = persisted
    elif docs:
        _active_doc = docs[0]
        _save_active(_active_doc)


_auto_select_first()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_pdf(contents: bytes) -> None:
    """Reject anything that isn't a real PDF by checking magic bytes."""
    if not contents.startswith(PDF_MAGIC_BYTES):
        raise HTTPException(
            status_code=400,
            detail="Invalid file. Only real PDF files are accepted."
        )

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}

# ---------------------------------------------------------------------------
# Auth endpoints — public, rate limited against brute force
# ---------------------------------------------------------------------------

@app.post("/auth/google")
@limiter.limit("10/minute")
async def auth_google(request: Request, body: GoogleAuthRequest):
    user  = verify_google_token(body.id_token)
    token = create_jwt(email=user["email"], name=user["name"])
    return {"token": token, "name": user["name"], "email": user["email"]}


@app.post("/auth/demo")
@limiter.limit("10/minute")
async def auth_demo(request: Request, body: DemoAuthRequest):
    user  = verify_demo_credentials(email=body.email, password=body.password)
    token = create_jwt(email=user["email"], name=user["name"])
    return {"token": token, "name": user["name"], "email": user["email"]}

# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------

@app.post("/upload", response_model=UploadResponse)
@limiter.limit("3/minute")
async def upload_pdf(
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    global _active_doc

    # 1. Extension check
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # 2. Read + size check
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    # 3. Magic bytes — confirm it's actually a PDF
    _validate_pdf(contents)

    # 4. Sanitize filename
    safe_name = os.path.basename(file.filename).strip()

    # 5. Write to temp, extract, clean up
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        text   = extract_text_from_pdf(tmp_path)
        chunks = chunk_text(text)
    finally:
        os.unlink(tmp_path)

    if not chunks:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    embeddings = get_embeddings(chunks)
    dimension  = embeddings.shape[1]
    index      = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    _save_doc(safe_name, chunks, index)

    _active_doc = safe_name
    _save_active(_active_doc)

    return UploadResponse(message=f"'{safe_name}' indexed successfully.", chunks=len(chunks))


@app.post("/select")
@limiter.limit("30/minute")
async def select_document(
    request: Request,
    body: SelectRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    global _active_doc
    docs = _list_docs()
    if body.document not in docs:
        raise HTTPException(status_code=404, detail=f"Document '{body.document}' not found.")
    _active_doc = body.document
    _save_active(_active_doc)
    return {"message": f"Active document set to '{body.document}'", "document": body.document}


@app.get("/documents", response_model=DocumentsResponse)
@limiter.limit("30/minute")
async def list_documents(
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    docs = _list_docs()
    return DocumentsResponse(documents=docs, active=_active_doc)


@app.post("/reset")
@limiter.limit("5/minute")
async def reset(
    request: Request,
    user: Annotated[dict, Depends(get_current_user)],
):
    global _active_doc
    import shutil
    if os.path.exists(VECTORSTORE_DIR):
        shutil.rmtree(VECTORSTORE_DIR)
        os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    _active_doc = None
    _save_active(None)
    return {"message": "All documents cleared."}


@app.post("/ask", response_model=AskResponse)
@limiter.limit("15/minute")
async def ask_question(
    request: Request,
    body: AskRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    if not _active_doc:
        raise HTTPException(status_code=400, detail="No document selected. Please upload or select a PDF first.")

    if len(body.question) > MAX_QUESTION_LEN:
        raise HTTPException(status_code=400, detail=f"Question too long. Maximum {MAX_QUESTION_LEN} characters.")

    chunks, index = _load_doc(_active_doc)
    if chunks is None:
        raise HTTPException(status_code=400, detail="Active document could not be loaded.")

    intent = detect_intent(body.question)
    if intent == "summarize":
        selected_chunks = get_summary_chunks(chunks, n=10)
    elif intent == "explain":
        selected_chunks = get_summary_chunks(chunks, n=15)
    else:
        selected_chunks = retrieve_chunks(body.question, chunks, index)

    messages = build_prompt(selected_chunks, body.question)
    answer   = ask_llm_groq(messages)
    return AskResponse(answer=answer)


@app.post("/ask/stream")
@limiter.limit("15/minute")
async def ask_question_stream(
    request: Request,
    body: AskRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    if not _active_doc:
        raise HTTPException(status_code=400, detail="No document selected. Please upload or select a PDF first.")

    if len(body.question) > MAX_QUESTION_LEN:
        raise HTTPException(status_code=400, detail=f"Question too long. Maximum {MAX_QUESTION_LEN} characters.")

    chunks, index = _load_doc(_active_doc)
    if chunks is None:
        raise HTTPException(status_code=400, detail="Active document could not be loaded.")

    intent = detect_intent(body.question)
    if intent == "summarize":
        selected_chunks = get_summary_chunks(chunks, n=10)
    elif intent == "explain":
        selected_chunks = get_summary_chunks(chunks, n=15)
    else:
        selected_chunks = retrieve_chunks(body.question, chunks, index)

    prompt = build_prompt(selected_chunks, body.question)

    def token_generator():
        for token in ask_llm_groq_stream(prompt):
            safe = token.replace("\n", "\\n")
            yield f"data: {safe}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
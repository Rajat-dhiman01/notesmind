# backend/app.py

import os
import json
import tempfile
from typing import Annotated, List

import faiss
import numpy as np
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

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
# App + Middleware
# ---------------------------------------------------------------------------

app = FastAPI(title="NotesMind API", version="1.0.0")

_raw_origins = os.environ.get("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

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
#
# vectorstore/
#   Unit1_cmos/
#     chunks.json
#     index.faiss
#   Unit2_signals/
#     chunks.json
#     index.faiss
# ---------------------------------------------------------------------------

VECTORSTORE_DIR = os.environ.get(
    "VECTORSTORE_DIR",
    os.path.join(os.path.dirname(__file__), "vectorstore")
)

# Active document — which PDF the user is currently chatting with
_active_doc: str | None = None


def _doc_dir(doc_name: str) -> str:
    """Return the folder path for a given document name."""
    # Sanitize — strip path separators to prevent directory traversal
    safe_name = os.path.basename(doc_name)
    return os.path.join(VECTORSTORE_DIR, safe_name)


def _save_doc(doc_name: str, chunks: List[str], index: faiss.IndexFlatL2):
    """Persist chunks + FAISS index for a single document."""
    folder = _doc_dir(doc_name)
    os.makedirs(folder, exist_ok=True)
    faiss.write_index(index, os.path.join(folder, "index.faiss"))
    with open(os.path.join(folder, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump({"chunks": chunks}, f)


def _load_doc(doc_name: str):
    """Load chunks + FAISS index for a single document. Returns (chunks, index)."""
    folder = _doc_dir(doc_name)
    index_path = os.path.join(folder, "index.faiss")
    chunks_path = os.path.join(folder, "chunks.json")
    if not os.path.exists(index_path) or not os.path.exists(chunks_path):
        return None, None
    index = faiss.read_index(index_path)
    with open(chunks_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["chunks"], index


def _list_docs() -> List[str]:
    """Return list of all document names that have been indexed."""
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
    """If no active doc is set, auto-select the first available one."""
    global _active_doc
    if _active_doc is None:
        docs = _list_docs()
        if docs:
            _active_doc = docs[0]


# Auto-select on startup if docs already exist from a previous run
_auto_select_first()

# ---------------------------------------------------------------------------
# Auth endpoints — public
# ---------------------------------------------------------------------------

@app.post("/auth/google")
async def auth_google(request: GoogleAuthRequest):
    user = verify_google_token(request.id_token)
    token = create_jwt(email=user["email"], name=user["name"])
    return {"token": token, "name": user["name"], "email": user["email"]}


@app.post("/auth/demo")
async def auth_demo(request: DemoAuthRequest):
    user = verify_demo_credentials(email=request.email, password=request.password)
    token = create_jwt(email=user["email"], name=user["name"])
    return {"token": token, "name": user["name"], "email": user["email"]}

# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    user: Annotated[dict, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    global _active_doc

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        text = extract_text_from_pdf(tmp_path)
        chunks = chunk_text(text)
    finally:
        os.unlink(tmp_path)

    if not chunks:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    embeddings = get_embeddings(chunks)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    _save_doc(file.filename, chunks, index)

    # Auto-select the newly uploaded doc
    _active_doc = file.filename

    return UploadResponse(message=f"'{file.filename}' indexed successfully.", chunks=len(chunks))


@app.post("/select")
async def select_document(
    request: SelectRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    """Set the active document. All subsequent /ask calls will use this doc."""
    global _active_doc
    docs = _list_docs()
    if request.document not in docs:
        raise HTTPException(status_code=404, detail=f"Document '{request.document}' not found.")
    _active_doc = request.document
    return {"message": f"Active document set to '{request.document}'", "document": request.document}


@app.get("/documents", response_model=DocumentsResponse)
async def list_documents(
    user: Annotated[dict, Depends(get_current_user)],
):
    docs = _list_docs()
    return DocumentsResponse(documents=docs, active=_active_doc)


@app.post("/reset")
async def reset(
    user: Annotated[dict, Depends(get_current_user)],
):
    """Delete all indexed documents and clear active doc."""
    global _active_doc
    import shutil
    if os.path.exists(VECTORSTORE_DIR):
        shutil.rmtree(VECTORSTORE_DIR)
        os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    _active_doc = None
    return {"message": "All documents cleared."}


@app.post("/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    if not _active_doc:
        raise HTTPException(status_code=400, detail="No document selected. Please upload or select a PDF first.")

    chunks, index = _load_doc(_active_doc)
    if chunks is None:
        raise HTTPException(status_code=400, detail="Active document could not be loaded.")

    intent = detect_intent(request.question)
    if intent == "summarize":
        selected_chunks = get_summary_chunks(chunks, n=10)
    else:
        selected_chunks = retrieve_chunks(request.question, chunks, index)

    messages = build_prompt(selected_chunks, request.question)
    from backend.rag_pipeline import ask_llm_groq
    answer = ask_llm_groq(messages)
    return AskResponse(answer=answer)


@app.post("/ask/stream")
async def ask_question_stream(
    request: AskRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    if not _active_doc:
        raise HTTPException(status_code=400, detail="No document selected. Please upload or select a PDF first.")

    chunks, index = _load_doc(_active_doc)
    if chunks is None:
        raise HTTPException(status_code=400, detail="Active document could not be loaded.")

    intent = detect_intent(request.question)
    if intent == "summarize":
        selected_chunks = get_summary_chunks(chunks, n=10)
    else:
        selected_chunks = retrieve_chunks(request.question, chunks, index)

    prompt = build_prompt(selected_chunks, request.question)

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
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
    ask_llm_stream,
    build_prompt,
    chunk_text,
    detect_intent,
    extract_text_from_pdf,
    get_embeddings,
    get_summary_chunks,
    rag_query,
    retrieve_chunks,
)

# ---------------------------------------------------------------------------
# App + Middleware
# ---------------------------------------------------------------------------

app = FastAPI(title="NotesMind API", version="1.0.0")

# CORS — reads allowed origins from env var so production URL can be injected
# FRONTEND_URL must be set in Railway dashboard to the Vercel production URL
# Falls back to localhost for local development
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

# ---------------------------------------------------------------------------
# Vectorstore — in-memory state + disk persistence
#
# VECTORSTORE_DIR reads from env var on Railway (persistent volume mount path)
# Falls back to local relative path for development on Windows
# ---------------------------------------------------------------------------

VECTORSTORE_DIR = os.environ.get(
    "VECTORSTORE_DIR",
    os.path.join(os.path.dirname(__file__), "vectorstore")
)
INDEX_FILE = os.path.join(VECTORSTORE_DIR, "index.faiss")
CHUNKS_FILE = os.path.join(VECTORSTORE_DIR, "chunks.json")

_chunks: List[str] = []
_metadata: List[dict] = []
_index: faiss.IndexFlatL2 | None = None


def save_index():
    os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    faiss.write_index(_index, INDEX_FILE)
    with open(CHUNKS_FILE, "w", encoding="utf-8") as f:
        json.dump({"chunks": _chunks, "metadata": _metadata}, f)


def load_index():
    global _chunks, _metadata, _index
    if os.path.exists(INDEX_FILE) and os.path.exists(CHUNKS_FILE):
        _index = faiss.read_index(INDEX_FILE)
        with open(CHUNKS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            _chunks = data["chunks"]
            _metadata = data.get("metadata", [])


load_index()

# ---------------------------------------------------------------------------
# Auth endpoints — public (no token required)
# ---------------------------------------------------------------------------

@app.post("/auth/google")
async def auth_google(request: GoogleAuthRequest):
    """
    Validate a Google id_token and issue a NotesMind JWT.
    Frontend receives the JWT and attaches it to every subsequent request.
    """
    user = verify_google_token(request.id_token)
    token = create_jwt(email=user["email"], name=user["name"])
    return {"token": token, "name": user["name"], "email": user["email"]}


@app.post("/auth/demo")
async def auth_demo(request: DemoAuthRequest):
    """
    Validate demo credentials and issue a NotesMind JWT.
    For testing only — credentials are hardcoded in auth.py.
    """
    user = verify_demo_credentials(email=request.email, password=request.password)
    token = create_jwt(email=user["email"], name=user["name"])
    return {"token": token, "name": user["name"], "email": user["email"]}

# ---------------------------------------------------------------------------
# Protected endpoints — valid JWT required on every request
# ---------------------------------------------------------------------------

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    user: Annotated[dict, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    global _chunks, _metadata, _index

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        text = extract_text_from_pdf(tmp_path)
        new_chunks = chunk_text(text)
    finally:
        os.unlink(tmp_path)

    new_metadata = [
        {"source": file.filename, "chunk_index": i}
        for i in range(len(new_chunks))
    ]

    _chunks.extend(new_chunks)
    _metadata.extend(new_metadata)

    embeddings = get_embeddings(_chunks)
    dimension = embeddings.shape[1]
    _index = faiss.IndexFlatL2(dimension)
    _index.add(embeddings)

    save_index()

    return UploadResponse(message="PDF indexed successfully.", chunks=len(new_chunks))


@app.post("/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    global _chunks, _index

    if not _chunks or _index is None:
        raise HTTPException(
            status_code=400,
            detail="No PDF uploaded yet. Please upload a PDF first."
        )

    answer = rag_query(request.question, _chunks, _index)
    return AskResponse(answer=answer)


@app.get("/documents", response_model=DocumentsResponse)
async def list_documents(
    user: Annotated[dict, Depends(get_current_user)],
):
    sources = list({m["source"] for m in _metadata})
    return DocumentsResponse(documents=sources)


@app.post("/reset")
async def reset(
    user: Annotated[dict, Depends(get_current_user)],
):
    global _chunks, _metadata, _index
    _chunks = []
    _metadata = []
    _index = None
    if os.path.exists(INDEX_FILE):
        os.remove(INDEX_FILE)
    if os.path.exists(CHUNKS_FILE):
        os.remove(CHUNKS_FILE)
    return {"message": "reset"}


@app.post("/ask/stream")
async def ask_question_stream(
    request: AskRequest,
    user: Annotated[dict, Depends(get_current_user)],
):
    global _chunks, _index

    if not _chunks or _index is None:
        raise HTTPException(
            status_code=400,
            detail="No PDF uploaded yet. Please upload a PDF first."
        )

    intent = detect_intent(request.question)

    if intent == "summarize":
        selected_chunks = get_summary_chunks(_chunks, n=10)
    else:
        selected_chunks = retrieve_chunks(request.question, _chunks, _index)

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
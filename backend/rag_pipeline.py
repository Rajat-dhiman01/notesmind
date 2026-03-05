# backend/rag_pipeline.py

from typing import List
import numpy as np
import faiss
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
from rank_bm25 import BM25Okapi
from groq import Groq
from sentence_transformers import CrossEncoder
load_dotenv()

CHUNK_SIZE = 500
CHUNK_OVERLAP = 150
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model
_reranker = None
_groq_client = None


def get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _groq_client
def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _reranker

def extract_text_from_pdf(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    pages = []
    for page in reader.pages:
        text = page.extract_text(extraction_mode="layout") or ""
        # Normalize common Unicode math symbols pypdf garbles
        text = text.replace("\u00d7", "x")   # × → x
        text = text.replace("\u00f7", "/")   # ÷ → /
        text = text.replace("\u2212", "-")   # − → -
        text = text.replace("\u2260", "!=")  # ≠ → !=
        pages.append(text)
    return "\n".join(pages)


def chunk_text(text: str) -> List[str]:
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]
        chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def get_embeddings(chunks: List[str]) -> np.ndarray:
    model = get_model()
    embeddings = model.encode(chunks, convert_to_numpy=True)
    return embeddings


def build_faiss_index(chunks: List[str]) -> faiss.IndexFlatL2:
    embeddings = get_embeddings(chunks)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index
def bm25_retrieve(query: str, chunks: List[str], top_k: int = 5) -> List[tuple]:
    tokenized_chunks = [chunk.lower().split() for chunk in chunks]
    tokenized_query = query.lower().split()
    bm25 = BM25Okapi(tokenized_chunks)
    scores = bm25.get_scores(tokenized_query)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    return [(chunks[i], scores[i], i) for i in top_indices]
def rerank_chunks(query: str, chunks: List[str], top_k: int = 3) -> List[str]:
    reranker = get_reranker()
    pairs = [(query, chunk) for chunk in chunks]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(scores, chunks), key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in ranked[:top_k]]

def retrieve_chunks(query: str, chunks: List[str], index, top_k: int = 5) -> List[str]:
    # FAISS semantic retrieval
    query_vec = get_embeddings([query])
    distances, indices = index.search(query_vec, top_k)
    faiss_results = {}
    for rank, (dist, idx) in enumerate(zip(distances[0], indices[0])):
        faiss_results[idx] = 1 / (1 + dist)   # convert distance → score

    # BM25 keyword retrieval
    bm25_results = {}
    for chunk, score, idx in bm25_retrieve(query, chunks, top_k):
        bm25_results[idx] = score

    # Normalize BM25 scores to 0-1 range
    if bm25_results:
        max_bm25 = max(bm25_results.values()) or 1
        bm25_results = {k: v / max_bm25 for k, v in bm25_results.items()}

    # Combine: equal weight (0.5 each)
    all_indices = set(faiss_results.keys()) | set(bm25_results.keys())
    combined = {}
    for idx in all_indices:
        combined[idx] = (faiss_results.get(idx, 0) * 0.5) + (bm25_results.get(idx, 0) * 0.5)

    # Return top_k chunks sorted by combined score
  
    top = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:top_k]
    candidate_chunks = [chunks[idx] for idx, _ in top]

    # Rerank candidates using cross-encoder
    final = rerank_chunks(query, candidate_chunks)

    # TEMPORARY DEBUG
    
    return final

def build_prompt(chunks: List[str], question: str) -> List[dict]:
    context = "\n\n".join(chunks)
    system = (
        "You are an expert study assistant. Your job is to explain concepts clearly from the provided context.\n\n"
        "RULES:\n"
        "- Answer ONLY from the context. If not found, say: 'This topic is not covered in the uploaded document.'\n"
        "- Write in clean, structured markdown.\n"
        "- Use ## for main headings, ### for sub-headings.\n"
        "- Use bullet points (- ) for lists. Never run list items into one line.\n"
        "- Use **bold** for key terms and definitions.\n"
        "- Always put a blank line before and after every heading.\n"
        "- Never duplicate content. Never repeat the question back.\n"
        "- Do not output raw PDF text. Rewrite it cleanly.\n"
        "- Do not mention 'context' or 'document' in your answer.\n"
    )
    user = f"Context:\n{context}\n\nQuestion: {question}"
    return [
        {"role": "system", "content": system},
        {"role": "user",   "content": user},
    ]
def ask_llm(prompt: str, model: str = "tinyllama") -> str:
    import urllib.request
    import json

    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False
    }).encode("utf-8")

    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode("utf-8"))
        return result["response"].strip()

def ask_llm_stream(prompt: str, model: str = "tinyllama"):
    """
    Generator that streams tokens from Ollama one by one.
    Yields each token string as it arrives.
    Ollama stream=True returns one JSON object per line.
    """
    import urllib.request
    import json

    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": True
    }).encode("utf-8")

    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req) as response:
        for raw_line in response:
            line = raw_line.decode("utf-8").strip()
            if not line:
                continue
            try:
                chunk = json.loads(line)
            except json.JSONDecodeError:
                continue

            token = chunk.get("response", "")
            if token:
                yield token

            # Ollama sets done=True on the final chunk
            if chunk.get("done", False):
                break

def rag_query(
    question: str,
    chunks: List[str],
    index: faiss.IndexFlatL2,
    top_k: int = 3
) -> str:
    retrieved = retrieve_chunks(question, chunks, index, top_k=top_k)

    print("\n\n==== RETRIEVED CHUNKS ====")
    for i, chunk in enumerate(retrieved):
        print(f"\n--- Chunk {i+1} ---\n{chunk[:500]}")
    print("\n==========================\n")

    prompt = build_prompt(retrieved, question)
    answer = ask_llm(prompt)
    return answer

def ask_llm_groq(messages: List[dict]) -> str:
    client = get_groq_client()
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        max_tokens=1024,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()




def ask_llm_groq_stream(messages: List[dict]):
    client = get_groq_client()
    stream = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        max_tokens=1024,
        temperature=0.3,
        stream=True,
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token

SUMMARIZE_KEYWORDS = {
    "summarize", "summary", "overview", "brief", "outline",
    "what is this about", "what does this document",
    "what is this document", "tldr", "tl;dr", "gist",
    "main points", "key points", "what does it cover"
}

def detect_intent(question: str) -> str:
    q = question.lower().strip()
    for keyword in SUMMARIZE_KEYWORDS:
        if keyword in q:
            return "summarize"
    return "qa"


def get_summary_chunks(chunks: List[str], n: int = 10) -> List[str]:
    return chunks[:n]           
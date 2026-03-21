# NotesMind

Upload a PDF. Ask questions. Get answers - strictly from your document, nothing hallucinated.

Live at **[notesmind.pro](https://notesmind.pro)**

---

## What it does

NotesMind is a RAG (Retrieval-Augmented Generation) SaaS app. You upload a PDF - research paper, textbook chapter, legal document, anything - and ask questions about it in natural language. The system retrieves the most relevant chunks from your document and passes them to an LLM with strict grounding instructions. It won't make things up.

The target users are people handling sensitive or technical documents: researchers, students, analysts. The "no hallucination" constraint is the whole point.

---

## How the retrieval works

Most RAG tutorials just do FAISS similarity search and call it done. NotesMind uses a three-stage pipeline:

1. **Hybrid retrieval** - FAISS semantic search + BM25 keyword retrieval run in parallel, scores fused 50/50
2. **Cross-encoder reranking** - top candidates reranked by `ms-marco-MiniLM-L-6-v2` for precision
3. **Intent routing** - `detect_intent()` distinguishes summarization vs. QA queries and routes accordingly

The hybrid approach catches things pure semantic search misses (exact terms, acronyms, names) and vice versa.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, Framer Motion |
| Backend | FastAPI, Python 3.14 |
| Embeddings | `all-MiniLM-L6-v2` via sentence-transformers |
| Vector store | FAISS (faiss-cpu) |
| Keyword retrieval | rank_bm25 |
| Reranking | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| LLM | Llama 3.1 8B Instant via Groq |
| Streaming | SSE - FastAPI StreamingResponse → fetch() ReadableStream |
| Auth | Google OAuth 2.0 + Demo login, JWT via python-jose |
| Rate limiting | slowapi - per-endpoint IP limits |
| Deployment | Railway (backend) + Vercel (frontend) |
| Domain | notesmind.pro via Hostinger + Cloudflare |

---


## Security

- All API keys server-side only (Railway env vars)
- Rate limiting on every endpoint (10/min auth, 15/min ask, 3/min upload)
- 10MB PDF cap + magic byte validation + filename sanitization
- 2000 character question cap
- JWT expiry checked on mount
- Security headers via vercel.json (HSTS, X-Frame-Options, X-XSS-Protection, Referrer-Policy)

---

## What I learned building this

Getting CPU-only PyTorch to deploy on Railway was the first real obstacle - the default wheel pulls CUDA and blows the memory limit. Fixed by pointing pip to the CPU-only index before install.

The bigger lesson was about retrieval quality. FAISS alone was missing exact technical terms that BM25 caught easily, and BM25 alone was missing semantic matches. The hybrid approach with score fusion was a meaningful improvement in answer quality, not just a theoretical one.

---

## Status

✅ Live - [notesmind.pro](https://notesmind.pro)  
✅ Google Search Console verified + sitemap submitted  
🔄 Upcoming: per-user document isolation, chat history, citation mode

---

## Author

Rajat Dhiman · [GitHub](https://github.com/Rajat-dhiman01) · [LinkedIn](https://linkedin.com/in/rajatdhiman) · rkdhiman831@gmail.com

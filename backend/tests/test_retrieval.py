from backend.rag_pipeline import build_faiss_index, retrieve_chunks


def test_index_builds_without_error():
    chunks = ["Python is a programming language.", "FAISS is a vector search library.", "RAG stands for retrieval augmented generation."]
    index = build_faiss_index(chunks)
    assert index is not None


def test_retrieval_returns_correct_count():
    chunks = ["Python is a programming language.", "FAISS is a vector search library.", "RAG stands for retrieval augmented generation."]
    index = build_faiss_index(chunks)
    results = retrieve_chunks("what is Python", chunks, index, top_k=2)
    assert len(results) == 2


def test_retrieval_returns_relevant_chunk():
    chunks = ["Python is a programming language.", "FAISS is a vector search library.", "RAG stands for retrieval augmented generation."]
    index = build_faiss_index(chunks)
    results = retrieve_chunks("what is Python", chunks, index, top_k=1)
    assert "Python" in results[0]


def test_retrieval_top_k_does_not_exceed_total_chunks():
    chunks = ["Only one chunk here."]
    index = build_faiss_index(chunks)
    results = retrieve_chunks("something", chunks, index, top_k=5)
    assert len(results) <= len(chunks)
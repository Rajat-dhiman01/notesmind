# tests/test_embedding.py

from backend.rag_pipeline import get_embeddings


def test_embeddings_are_not_empty():
    chunks = ["This is a test sentence."]
    embeddings = get_embeddings(chunks)
    assert len(embeddings) > 0


def test_embedding_dimension_is_correct():
    chunks = ["This is a test sentence."]
    embeddings = get_embeddings(chunks)
    # all-MiniLM-L6-v2 outputs 384 dimensions
    assert embeddings.shape[1] == 384


def test_multiple_chunks_produce_multiple_embeddings():
    chunks = ["First chunk.", "Second chunk.", "Third chunk."]
    embeddings = get_embeddings(chunks)
    assert embeddings.shape[0] == 3


def test_embeddings_are_not_zero():
    chunks = ["This is a test sentence."]
    embeddings = get_embeddings(chunks)
    assert embeddings.sum() != 0
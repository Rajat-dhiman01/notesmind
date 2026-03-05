from backend.rag_pipeline import chunk_text


def test_chunks_are_not_empty():
    text = "word " * 500
    chunks = chunk_text(text)
    assert len(chunks) > 0


def test_chunk_size_is_within_limit():
    text = "word " * 500
    chunks = chunk_text(text)
    for chunk in chunks:
        assert len(chunk) <= 500


def test_overlap_exists_between_chunks():
    text = "word " * 500
    chunks = chunk_text(text)
    if len(chunks) > 1:
        end_of_first = chunks[0][-50:]
        assert end_of_first in chunks[1]


def test_empty_text_returns_empty_list():
    chunks = chunk_text("")
    assert chunks == []


def test_short_text_returns_single_chunk():
    text = "This is a short sentence."
    chunks = chunk_text(text)
    assert len(chunks) == 1
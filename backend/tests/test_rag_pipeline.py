# backend/tests/test_rag_pipeline.py

from backend.rag_pipeline import (
    chunk_text,
    build_faiss_index,
    retrieve_chunks,
    build_prompt,
    ask_llm,
    rag_query
)


def test_build_prompt_contains_context():
    chunks = ["Python is a programming language."]
    question = "What is Python?"
    prompt = build_prompt(chunks, question)
    assert "Python is a programming language." in prompt
    assert "What is Python?" in prompt


def test_build_prompt_contains_instruction():
    chunks = ["Some context here."]
    question = "What is this about?"
    prompt = build_prompt(chunks, question)
    assert "context" in prompt.lower()


def test_ask_llm_returns_non_empty_string():
    prompt = "Answer in one word: what color is the sky?"
    response = ask_llm(prompt)
    assert isinstance(response, str)
    assert len(response) > 0


def test_rag_query_returns_string():
    chunks = [
        "Python is a high level programming language.",
        "It was created by Guido van Rossum.",
        "Python is known for its simple syntax."
    ]
    index = build_faiss_index(chunks)
    answer = rag_query("Who created Python?", chunks, index)
    assert isinstance(answer, str)
    assert len(answer) > 0

# backend/main.py

from backend.rag_pipeline import (
    extract_text_from_pdf,
    chunk_text,
    build_faiss_index,
    rag_query
)


def run(pdf_path: str, question: str):
    print("Extracting text...")
    text = extract_text_from_pdf(pdf_path)
    print(f"Extracted {len(text)} characters")

    print("Chunking...")
    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks")

    print("Building FAISS index...")
    index = build_faiss_index(chunks)

    print(f"\nQuestion: {question}")
    print("Generating answer...\n")
    answer = rag_query(question, chunks, index)
    print(f"Answer:\n{answer}")


if __name__ == "__main__":
    run("backend/data/sample.pdf", "what is this document about")

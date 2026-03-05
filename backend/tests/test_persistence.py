# backend/tests/test_persistence.py

import io
import os
import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)


def get_sample_pdf_bytes() -> bytes:
    with open("backend/data/sample.pdf", "rb") as f:
        return f.read()


def test_index_saved_to_disk_after_upload():
    client.post("/reset")
    pdf_bytes = get_sample_pdf_bytes()
    client.post(
        "/upload",
        files={"file": ("sample.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert os.path.exists("backend/vectorstore/index.faiss")
    assert os.path.exists("backend/vectorstore/chunks.json")


def test_index_loads_on_startup():
    pdf_bytes = get_sample_pdf_bytes()
    client.post("/reset")
    client.post(
        "/upload",
        files={"file": ("sample.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    from backend.app import load_index
    load_index()
    response = client.post("/ask", json={"question": "what is this document about"})
    assert response.status_code == 200


def test_metadata_stored_with_chunks():
    client.post("/reset")
    pdf_bytes = get_sample_pdf_bytes()
    client.post(
        "/upload",
        files={"file": ("sample.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    response = client.get("/documents")
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert len(data["documents"]) > 0


def test_multiple_documents_tracked():
    client.post("/reset")
    pdf_bytes = get_sample_pdf_bytes()
    client.post(
        "/upload",
        files={"file": ("doc1.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    client.post(
        "/upload",
        files={"file": ("doc2.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    response = client.get("/documents")
    data = response.json()
    assert len(data["documents"]) == 2
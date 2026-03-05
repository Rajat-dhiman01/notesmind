# backend/tests/test_api.py

import io
import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)


def get_sample_pdf_bytes() -> bytes:
    with open("backend/data/sample.pdf", "rb") as f:
        return f.read()


def test_upload_pdf_returns_success():
    pdf_bytes = get_sample_pdf_bytes()
    response = client.post(
        "/upload",
        files={"file": ("sample.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "chunks" in data
    assert data["chunks"] > 0


def test_ask_returns_answer_after_upload():
    pdf_bytes = get_sample_pdf_bytes()
    client.post(
        "/upload",
        files={"file": ("sample.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    response = client.post("/ask", json={"question": "what is this document about"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 0


def test_ask_before_upload_returns_error():
    client.post("/reset")
    response = client.post("/ask", json={"question": "what is this about"})
    assert response.status_code == 400
    assert response.json()["detail"] == "No PDF uploaded yet. Please upload a PDF first."




def test_upload_non_pdf_returns_error():
    response = client.post(
        "/upload",
        files={"file": ("notes.txt", io.BytesIO(b"some text content"), "text/plain")}
    )
    assert response.status_code == 400


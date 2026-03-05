# backend/models/schemas.py

from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str


class UploadResponse(BaseModel):
    message: str
    chunks: int


class DocumentsResponse(BaseModel):
    documents: list[str]


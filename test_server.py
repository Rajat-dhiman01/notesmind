# test_server.py

import urllib.request
import json

# Test upload
with open("backend/data/sample.pdf", "rb") as f:
    pdf_data = f.read()

boundary = "----FormBoundary"
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="sample.pdf"\r\n'
    f"Content-Type: application/pdf\r\n\r\n"
).encode() + pdf_data + f"\r\n--{boundary}--\r\n".encode()

req = urllib.request.Request(
    "http://127.0.0.1:8000/upload",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    method="POST"
)

with urllib.request.urlopen(req) as resp:
    print("Upload response:", json.loads(resp.read()))

# Test ask
payload = json.dumps({"question": "what is this document about"}).encode()
req2 = urllib.request.Request(
    "http://127.0.0.1:8000/ask",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)

with urllib.request.urlopen(req2) as resp:
    print("Ask response:", json.loads(resp.read()))



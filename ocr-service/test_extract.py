import base64
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True

def test_extract_403_without_token():
    r = client.post("/extract", json={"filename": "x.jpg", "mime_type": "image/jpeg", "image_base64": base64.b64encode(b"abc").decode()})
    assert r.status_code == 403

def test_extract_403_wrong_token():
    r = client.post("/extract", headers={"X-Internal-Token": "bad"}, json={"filename": "x.jpg", "mime_type": "image/jpeg", "image_base64": base64.b64encode(b"abc").decode()})
    assert r.status_code == 403

def test_extract_400_unsupported_mime():
    r = client.post("/extract", headers={"X-Internal-Token": "local-ocr-token"}, json={"filename": "x.jpg", "mime_type": "image/gif", "image_base64": base64.b64encode(b"abc").decode()})
    assert r.status_code == 400

def test_extract_timeout_or_ollama_fallback_does_not_crash():
    # even if Ollama is down, endpoint should return 200 with fallback and never 500
    # use smallest valid image base64 (1x1 png)
    tiny = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
    r = client.post("/extract", headers={"X-Internal-Token": "local-ocr-token"}, json={"filename": "P0001.jpg", "mime_type": "image/png", "image_base64": tiny})
    # if P0001.jpg is in label map, should be 200 with medicine_name from label
    # otherwise falls back to regex — still 200
    assert r.status_code in (200, 422)
    if r.status_code == 200:
        j = r.json()
        assert "medicine_name" in j

# PillSync local OCR service

This service is internal-only. The browser never calls it directly; the Node API proxies authenticated patient uploads to it.

## Setup

Install Python 3.10+ and Ollama. In Ollama, download the local models:

    ollama pull moondream
    ollama pull qwen2:1.5b

`moondream` is the lightweight vision model used to read the image. `qwen2:1.5b` is the lightweight local text model used to autofill and normalize the medicine name, dosage, frequency, side effects, uses, and confidence fields. The older `llava` and `llama3.1` models are not required for this setup.

Create `.env` from `.env.example`, using the same `OCR_INTERNAL_TOKEN` value in `server/.env`. Install the two Python dependencies:

    pip install -r requirements.txt

Run from this directory:

    uvicorn main:app --host 127.0.0.1 --port 8001

The service binds only to loopback and has no database or authentication system of its own. The Node server provides the authenticated boundary.

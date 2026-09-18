#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Starting Event Memories FastAPI Backend on port 8000..."
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

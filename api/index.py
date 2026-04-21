"""
Vercel entrypoint for EcoLens.

Vercel's Python runtime picks up any `app` ASGI object exported from a file
inside `api/` and serves it as a serverless function. We re-export the
FastAPI instance defined in `backend/server.py` so the full app — `/api/*`
JSON routes AND `/share/*` HTML pages — runs on Vercel without duplication.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from server import app  # noqa: E402,F401  (re-exported for Vercel)

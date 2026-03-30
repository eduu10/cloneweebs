"""Startup script — boots app or shows import error on /health."""
import os
import sys
import traceback

port = int(os.environ.get("PORT", 8000))
startup_error = None

try:
    from src.main import app
except Exception as exc:
    startup_error = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
    print(f"IMPORT FAILED:\n{startup_error}", file=sys.stderr)

    from fastapi import FastAPI
    app = FastAPI()
    captured_error = startup_error

    @app.get("/health")
    @app.get("/")
    def fallback_health():
        return {"status": "import_failed", "error": captured_error}

import uvicorn
uvicorn.run(app, host="0.0.0.0", port=port)

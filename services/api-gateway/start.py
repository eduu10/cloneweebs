"""Startup script — prints diagnostics then boots the real app."""
import os
import sys
import traceback

port = int(os.environ.get("PORT", 8000))

print(f"=== CloneWeebs API Startup ===")
print(f"Python: {sys.version}")
print(f"PORT: {port}")

# Print all env vars (redacted)
for key in ["ENVIRONMENT", "JWT_SECRET_KEY", "DATABASE_URL", "SUPABASE_URL", "CORS_ORIGINS"]:
    val = os.environ.get(key, "")
    status = f"set ({len(val)} chars)" if val else "MISSING"
    print(f"  {key}: {status}")

try:
    print("Importing app...")
    from src.main import app
    print("Import OK!")
except Exception as exc:
    print(f"IMPORT FAILED: {exc}")
    traceback.print_exc()

    # Fall back to minimal healthcheck so we can see logs
    from fastapi import FastAPI
    app = FastAPI()

    @app.get("/health")
    def health():
        return {"status": "error", "error": str(exc)}

    @app.get("/")
    def root():
        return {"status": "error", "error": str(exc)}

import uvicorn
uvicorn.run(app, host="0.0.0.0", port=port)

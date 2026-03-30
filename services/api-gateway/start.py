"""Startup script with error diagnostics."""
import os
import sys
import traceback

port = int(os.environ.get("PORT", 8000))

print(f"Starting CloneWeebs API on port {port}...")
print(f"Python: {sys.version}")
print(f"ENV: {os.environ.get('ENVIRONMENT', 'not set')}")
print(f"JWT_SECRET_KEY: {'set' if os.environ.get('JWT_SECRET_KEY') else 'MISSING'}")
print(f"DATABASE_URL: {'set' if os.environ.get('DATABASE_URL') else 'MISSING'}")

try:
    from src.main import app
    print("App imported successfully!")
except Exception as exc:
    print(f"FATAL: Failed to import app: {exc}")
    traceback.print_exc()
    sys.exit(1)

import uvicorn
uvicorn.run(app, host="0.0.0.0", port=port)

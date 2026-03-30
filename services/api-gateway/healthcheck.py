"""Minimal health check server — used to diagnose Render startup issues."""
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/health")
def health():
    import os
    return {
        "status": "ok",
        "env": {
            "DATABASE_URL": ("set" if os.environ.get("DATABASE_URL") else "missing"),
            "JWT_SECRET_KEY": ("set" if os.environ.get("JWT_SECRET_KEY") else "missing"),
            "PORT": os.environ.get("PORT", "not set"),
        }
    }

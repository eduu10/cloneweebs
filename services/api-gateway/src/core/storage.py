"""Storage layer using Supabase Storage (free tier, 1GB).

Drop-in replacement for the previous MinIO-based storage.
All public functions maintain the same interface.
"""

import logging

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)

_STORAGE_BASE: str = ""


def _storage_url() -> str:
    global _STORAGE_BASE  # noqa: PLW0603
    if not _STORAGE_BASE:
        _STORAGE_BASE = f"{settings.supabase_url}/storage/v1"
    return _STORAGE_BASE


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "apikey": settings.supabase_service_key,
    }


def upload_file(
    object_name: str,
    data: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload a file to Supabase Storage. Returns the object_name."""
    url = f"{_storage_url()}/object/{settings.storage_bucket}/{object_name}"
    resp = httpx.post(
        url,
        headers={**_headers(), "Content-Type": content_type},
        content=data,
        timeout=60,
    )
    if resp.status_code in (200, 201):
        return object_name

    # If file exists, try upsert
    if resp.status_code == 400:
        resp = httpx.put(
            url,
            headers={**_headers(), "Content-Type": content_type},
            content=data,
            timeout=60,
        )
        resp.raise_for_status()
        return object_name

    resp.raise_for_status()
    return object_name


def get_presigned_url(object_name: str, expires_hours: int = 1) -> str:
    """Get a signed URL for temporary access to a private file."""
    url = f"{_storage_url()}/object/sign/{settings.storage_bucket}/{object_name}"
    resp = httpx.post(
        url,
        headers=_headers(),
        json={"expiresIn": expires_hours * 3600},
        timeout=10,
    )
    if resp.status_code == 200:
        data = resp.json()
        signed_url = data.get("signedURL", "")
        if signed_url.startswith("/"):
            return f"{settings.supabase_url}/storage/v1{signed_url}"
        return signed_url

    # Fallback: public URL
    return get_public_url(object_name)


def get_public_url(object_name: str) -> str:
    """Get the public URL for a file (bucket must have public policy)."""
    return f"{_storage_url()}/object/public/{settings.storage_bucket}/{object_name}"


def delete_file(object_name: str) -> None:
    """Delete a file from Supabase Storage."""
    url = f"{_storage_url()}/object/{settings.storage_bucket}"
    resp = httpx.delete(
        url,
        headers=_headers(),
        json={"prefixes": [object_name]},
        timeout=10,
    )
    if resp.status_code not in (200, 204):
        logger.warning("Failed to delete %s: %s", object_name, resp.text)


def check_health() -> bool:
    """Check if Supabase Storage is reachable."""
    try:
        url = f"{_storage_url()}/bucket"
        resp = httpx.get(url, headers=_headers(), timeout=5)
        return resp.status_code == 200
    except Exception:
        return False

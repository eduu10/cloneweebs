from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db
from src.models.consent import Consent
from src.models.user import User
from src.schemas.consent import ConsentCreate, ConsentResponse

router = APIRouter(prefix="/api/v1/consents", tags=["consents"])


def _extract_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    client = request.client
    if client is not None:
        return client.host

    return "0.0.0.0"


@router.post(
    "",
    response_model=ConsentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_consent(
    payload: ConsentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Consent:
    if not payload.accepted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O consentimento deve ser aceito para prosseguir.",
        )

    ip_address = _extract_client_ip(request)
    user_agent = request.headers.get("user-agent", "")

    consent = Consent(
        user_id=current_user.id,
        consent_type=payload.consent_type,
        version=payload.version,
        ip_address=ip_address,
        user_agent=user_agent,
        accepted=payload.accepted,
    )
    db.add(consent)
    await db.flush()
    await db.refresh(consent)
    return consent

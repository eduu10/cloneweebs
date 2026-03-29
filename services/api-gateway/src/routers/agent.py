"""Video Agent endpoints — conversations with Ollama LLM."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db
from src.models.agent_conversation import AgentConversation
from src.models.agent_message import AgentMessage
from src.models.user import User
from src.services.groq_client import LLMError, chat_with_llm

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    script: str | None
    suggested_avatar: str | None
    suggested_style: str | None
    created_at: str


class CreateConversationRequest(BaseModel):
    title: str = "Nova conversa"


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4096)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    body: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    conv = AgentConversation(owner_id=current_user.id, title=body.title)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    return ConversationResponse(
        id=str(conv.id),
        title=conv.title,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationResponse]:
    rows = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.owner_id == current_user.id)
        .order_by(AgentConversation.updated_at.desc())
    )
    convs = rows.scalars().all()

    return [
        ConversationResponse(
            id=str(c.id),
            title=c.title,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
        )
        for c in convs
    ]


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def list_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    conv = await _get_conversation_or_404(conversation_id, current_user.id, db)

    rows = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conv.id)
        .order_by(AgentMessage.created_at.asc())
    )
    msgs = rows.scalars().all()

    return [_message_response(m) for m in msgs]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    if not body.content.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mensagem não pode estar vazia.",
        )

    conv = await _get_conversation_or_404(conversation_id, current_user.id, db)

    # Persist user message
    user_msg = AgentMessage(
        conversation_id=conv.id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)
    await db.flush()

    # Build history for context (last 10 messages)
    rows = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conv.id)
        .order_by(AgentMessage.created_at.desc())
        .limit(10)
    )
    history_msgs = list(reversed(rows.scalars().all()))
    history = [
        {"role": m.role, "content": m.content}
        for m in history_msgs
        if str(m.id) != str(user_msg.id)
    ]

    # Call LLM (Groq)
    try:
        ai_response = await chat_with_llm(history, body.content)
    except LLMError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    # Persist AI message
    ai_msg = AgentMessage(
        conversation_id=conv.id,
        role="assistant",
        content=ai_response.message,
        script=ai_response.script,
        suggested_avatar=ai_response.suggested_avatar,
        suggested_style=ai_response.suggested_style,
    )
    db.add(ai_msg)

    # Update conversation title from first user message (M-2: hard cap at 100 chars)
    if conv.title == "Nova conversa":
        words = body.content.strip().split()
        title = " ".join(words[:6]) + ("..." if len(words) > 6 else "")
        conv.title = title[:100]

    await db.commit()
    await db.refresh(ai_msg)

    return _message_response(ai_msg)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_conversation_or_404(
    conversation_id: str,
    owner_id: object,
    db: AsyncSession,
) -> AgentConversation:
    try:
        from uuid import UUID
        conv_uuid = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa não encontrada.")

    result = await db.execute(
        select(AgentConversation).where(
            AgentConversation.id == conv_uuid,
            AgentConversation.owner_id == owner_id,
        )
    )
    conv = result.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa não encontrada.")
    return conv


def _message_response(m: AgentMessage) -> MessageResponse:
    return MessageResponse(
        id=str(m.id),
        role=m.role,
        content=m.content,
        script=m.script,
        suggested_avatar=m.suggested_avatar,
        suggested_style=m.suggested_style,
        created_at=m.created_at.isoformat(),
    )

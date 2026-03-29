import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AgentConversation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "agent_conversations"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255), nullable=False, default="Nova conversa"
    )

    owner: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="conversations"
    )
    messages: Mapped[list["AgentMessage"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "AgentMessage", back_populates="conversation", lazy="selectin"
    )

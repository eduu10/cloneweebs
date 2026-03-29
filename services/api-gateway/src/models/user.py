from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="client"
    )  # "admin" or "client"
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="pt-BR")
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    consents: Mapped[list["Consent"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Consent", back_populates="user", lazy="selectin"
    )
    avatars: Mapped[list["Avatar"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Avatar", back_populates="owner", lazy="selectin"
    )
    videos: Mapped[list["Video"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Video", back_populates="owner", lazy="selectin"
    )
    conversations: Mapped[list["AgentConversation"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "AgentConversation", back_populates="owner", lazy="selectin"
    )
    translate_jobs: Mapped[list["TranslateJob"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "TranslateJob", back_populates="owner", lazy="selectin"
    )

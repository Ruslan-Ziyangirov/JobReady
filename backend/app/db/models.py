"""Таблицы БД.

Разборы и планы, которые генерирует LLM, хранятся целиком в JSON-полях
в той же форме, что отдаёт API (см. app/schemas). Отдельными колонками
вынесено только то, по чему нужно искать или сортировать.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, JSONType


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


def utcnow() -> datetime:
    return datetime.now(UTC)


def as_utc(dt: datetime) -> datetime:
    """SQLite возвращает время без часового пояса — считаем его UTC."""
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, server_default=func.now()
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    goal: Mapped[str | None] = mapped_column(String(50))

    interviews: Mapped[list["Interview"]] = relationship(back_populates="user")


class SmsCode(TimestampMixin, Base):
    """Код подтверждения. Сам код не хранится — только HMAC от него."""

    __tablename__ = "sms_codes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=_uuid)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    # Имя из формы входа — пригодится, если пользователь новый.
    name: Mapped[str] = mapped_column(String(100))
    code_hash: Mapped[str] = mapped_column(String(64))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Session(TimestampMixin, Base):
    """Сессия входа. В cookie лежит токен, в БД — только его SHA-256."""

    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=_uuid)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship()


class Interview(TimestampMixin, Base):
    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    profession: Mapped[str] = mapped_column(String(50))
    grade: Mapped[str] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(50))
    goal: Mapped[str | None] = mapped_column(String(50))
    # in-progress | finished
    status: Mapped[str] = mapped_column(String(20), default="in-progress")
    # Вопросы, которые интервьюер планирует задать.
    questions: Mapped[list[str]] = mapped_column(JSONType, default=list)
    # Индекс текущего вопроса (с нуля) и сколько уточнений по нему уже задано.
    current_question: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    followups: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="interviews")
    messages: Mapped[list["InterviewMessage"]] = relationship(
        back_populates="interview", order_by="InterviewMessage.created_at"
    )
    result: Mapped["InterviewResult | None"] = relationship(back_populates="interview")


class InterviewMessage(TimestampMixin, Base):
    __tablename__ = "interview_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=_uuid)
    interview_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True)
    # ai | user
    role: Mapped[str] = mapped_column(String(10))
    text: Mapped[str] = mapped_column(Text)

    interview: Mapped[Interview] = relationship(back_populates="messages")


class InterviewResult(TimestampMixin, Base):
    __tablename__ = "interview_results"

    interview_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("interviews.id", ondelete="CASCADE"), primary_key=True
    )
    overall: Mapped[float] = mapped_column(Float)
    # Полный разбор в форме схемы InterviewResult.
    payload: Mapped[dict[str, Any]] = mapped_column(JSONType)

    interview: Mapped[Interview] = relationship(back_populates="result")


class Plan(TimestampMixin, Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    interview_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("interviews.id", ondelete="SET NULL"))
    # Полный план в форме схемы Plan.
    payload: Mapped[dict[str, Any]] = mapped_column(JSONType)

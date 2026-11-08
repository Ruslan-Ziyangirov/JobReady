"""Вход по номеру телефона: код из SMS → сессия в cookie."""

import hashlib
import math
import hmac
import secrets
from datetime import timedelta
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import Session, SmsCode, User, as_utc, utcnow
from app.services.sms import SmsSender

CODE_TTL = timedelta(minutes=5)
RESEND_AFTER = timedelta(seconds=60)
MAX_CODES_PER_HOUR = 5
MAX_ATTEMPTS = 5

SESSION_COOKIE = "session"


class AuthError(Exception):
    def __init__(self, status: int, message: str, **extra: Any) -> None:
        super().__init__(message)
        self.status = status
        self.message = message
        self.extra = extra


def _code_hash(phone: str, code: str) -> str:
    return hmac.new(get_settings().secret, f"{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def _recent_codes(db: AsyncSession, phone: str) -> list[SmsCode]:
    rows = await db.scalars(
        select(SmsCode).where(SmsCode.phone == phone).order_by(SmsCode.created_at.desc()).limit(MAX_CODES_PER_HOUR)
    )
    return list(rows)


async def request_code(db: AsyncSession, sms: SmsSender, phone: str, name: str | None) -> int:
    """Создаёт и отправляет код. Возвращает, через сколько секунд можно запросить снова.

    name=None — повторная отправка: имя берётся из предыдущего запроса.
    """
    now = utcnow()
    recent = await _recent_codes(db, phone)

    if recent:
        wait = RESEND_AFTER - (now - as_utc(recent[0].created_at))
        if wait > timedelta(0):
            raise AuthError(429, "Код уже отправлен, подождите", retryAfter=math.ceil(wait.total_seconds()))

    in_last_hour = [c for c in recent if now - as_utc(c.created_at) < timedelta(hours=1)]
    if len(in_last_hour) >= MAX_CODES_PER_HOUR:
        wait = timedelta(hours=1) - (now - as_utc(in_last_hour[-1].created_at))
        raise AuthError(
            429, "Слишком много запросов кода. Попробуйте позже", retryAfter=math.ceil(wait.total_seconds())
        )

    if name is None:
        if not recent:
            raise AuthError(400, "Начните вход заново")
        name = recent[0].name

    code = f"{secrets.randbelow(10_000):04d}"
    db.add(
        SmsCode(
            phone=phone,
            name=name,
            code_hash=_code_hash(phone, code),
            created_at=now,
            expires_at=now + CODE_TTL,
        )
    )
    await db.commit()

    await sms.send(phone, f"JobReady: код для входа {code}")
    return int(RESEND_AFTER.total_seconds())


async def verify_code(db: AsyncSession, phone: str, code: str) -> tuple[User, str]:
    """Проверяет код. При успехе создаёт пользователя (если нового) и сессию; возвращает токен сессии."""
    now = utcnow()
    recent = await _recent_codes(db, phone)
    sms_code = recent[0] if recent else None

    if sms_code is None or sms_code.used_at is not None or as_utc(sms_code.expires_at) <= now:
        raise AuthError(400, "Код устарел — запросите новый")
    if sms_code.attempts >= MAX_ATTEMPTS:
        raise AuthError(400, "Слишком много попыток — запросите новый код")

    if not hmac.compare_digest(sms_code.code_hash, _code_hash(phone, code)):
        sms_code.attempts += 1
        await db.commit()
        left = MAX_ATTEMPTS - sms_code.attempts
        if left == 0:
            raise AuthError(400, "Слишком много попыток — запросите новый код")
        raise AuthError(400, "Неверный код", attemptsLeft=left)

    sms_code.used_at = now
    user = await db.scalar(select(User).where(User.phone == phone))
    if user is None:
        user = User(name=sms_code.name, phone=phone)
        db.add(user)
        await db.flush()

    token = secrets.token_urlsafe(32)
    db.add(
        Session(
            token_hash=_token_hash(token),
            user_id=user.id,
            expires_at=now + timedelta(days=get_settings().session_days),
        )
    )
    await db.commit()
    return user, token


async def user_by_token(db: AsyncSession, token: str) -> User | None:
    session = await db.scalar(select(Session).where(Session.token_hash == _token_hash(token)))
    if session is None or as_utc(session.expires_at) <= utcnow():
        return None
    return await db.get(User, session.user_id)


async def logout(db: AsyncSession, token: str) -> None:
    await db.execute(delete(Session).where(Session.token_hash == _token_hash(token)))
    await db.commit()

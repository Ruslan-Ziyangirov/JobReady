from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user
from app.core.config import get_settings
from app.db.models import User
from app.db.session import get_session
from app.schemas.auth import SmsRequest, SmsResendRequest, SmsSent, UserOut, VerifyRequest
from app.services import auth
from app.services.sms import SmsSender, get_sms_sender

router = APIRouter(prefix="/auth", tags=["auth"])


def _http_error(e: auth.AuthError) -> HTTPException:
    # Фронтенд показывает detail.message; retryAfter / attemptsLeft — для таймера и подсказок.
    return HTTPException(status_code=e.status, detail={"message": e.message, **e.extra})


@router.post("/sms", response_model=SmsSent)
async def send_code(
    body: SmsRequest,
    db: AsyncSession = Depends(get_session),
    sms: SmsSender = Depends(get_sms_sender),
) -> SmsSent:
    """Отправить код на номер. Имя сохранится, если пользователь новый."""
    try:
        retry_after = await auth.request_code(db, sms, body.phone, body.name)
    except auth.AuthError as e:
        raise _http_error(e) from e
    return SmsSent(retry_after=retry_after)


@router.post("/sms/resend", response_model=SmsSent)
async def resend_code(
    body: SmsResendRequest,
    db: AsyncSession = Depends(get_session),
    sms: SmsSender = Depends(get_sms_sender),
) -> SmsSent:
    try:
        retry_after = await auth.request_code(db, sms, body.phone, name=None)
    except auth.AuthError as e:
        raise _http_error(e) from e
    return SmsSent(retry_after=retry_after)


@router.post("/verify", response_model=UserOut)
async def verify(body: VerifyRequest, response: Response, db: AsyncSession = Depends(get_session)) -> User:
    """Проверить код. При успехе ставит httpOnly-cookie с сессией."""
    try:
        user, token = await auth.verify_code(db, body.phone, body.code)
    except auth.AuthError as e:
        raise _http_error(e) from e

    settings = get_settings()
    response.set_cookie(
        auth.SESSION_COOKIE,
        token,
        max_age=settings.session_days * 24 * 3600,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
    )
    return user


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)) -> User:
    return user


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_session),
    token: str | None = Cookie(default=None, alias=auth.SESSION_COOKIE),
) -> None:
    if token:
        await auth.logout(db, token)
    response.delete_cookie(auth.SESSION_COOKIE)

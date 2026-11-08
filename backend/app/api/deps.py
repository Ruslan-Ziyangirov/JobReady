from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_session
from app.services.auth import SESSION_COOKIE, user_by_token


async def current_user(
    db: AsyncSession = Depends(get_session),
    token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> User:
    """Зависимость для эндпоинтов, доступных только после входа."""
    user = await user_by_token(db, token) if token else None
    if user is None:
        raise HTTPException(status_code=401, detail={"message": "Нужно войти"})
    return user

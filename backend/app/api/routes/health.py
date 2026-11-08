from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.llm import LLMError, get_llm

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health(session: AsyncSession = Depends(get_session)) -> dict[str, str]:
    """Сервер и база данных живы."""
    await session.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/llm")
async def health_llm() -> JSONResponse:
    """Проверка связи с LLM без расхода токенов (только список моделей)."""
    try:
        llm = get_llm()
        models = await llm.list_models()
    except LLMError as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})
    return JSONResponse(content={"status": "ok", "provider": llm.name, "models": models})

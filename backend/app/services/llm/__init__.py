"""Доступ к LLM. Провайдер выбирается настройкой LLM_PROVIDER."""

from app.core.config import get_settings
from app.services.llm.base import LLMClient, LLMError, LLMMessage

__all__ = ["LLMClient", "LLMError", "LLMMessage", "get_llm", "close_llm"]

_client: LLMClient | None = None


def get_llm() -> LLMClient:
    """Общий клиент на всё приложение (держит access token и пул соединений)."""
    global _client
    if _client is None:
        settings = get_settings()
        if settings.llm_provider == "gigachat":
            from app.services.llm.gigachat import GigaChatClient

            _client = GigaChatClient(settings)
        else:  # pragma: no cover — защищено Literal в настройках
            raise LLMError(f"Неизвестный LLM_PROVIDER: {settings.llm_provider}")
    return _client


async def close_llm() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None

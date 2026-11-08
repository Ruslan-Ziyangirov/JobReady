from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from gigachat import GigaChat
from gigachat.exceptions import AuthenticationError, GigaChatException, RateLimitError
from gigachat.models import Chat, Messages, MessagesRole

from app.core.config import Settings
from app.services.llm.base import LLMError, LLMMessage

_ROLES = {
    "system": MessagesRole.SYSTEM,
    "user": MessagesRole.USER,
    "assistant": MessagesRole.ASSISTANT,
}


@asynccontextmanager
async def _explain_errors():
    """Переводит ошибки SDK и сети в LLMError с подсказкой, что чинить."""
    try:
        yield
    except AuthenticationError as e:
        raise LLMError("GigaChat отклонил ключ: проверьте GIGACHAT_AUTH_KEY и GIGACHAT_SCOPE в .env") from e
    except RateLimitError as e:
        raise LLMError("GigaChat: превышен лимит запросов или закончилась квота") from e
    except GigaChatException as e:
        raise LLMError(f"GigaChat вернул ошибку: {e}") from e
    except httpx.HTTPError as e:
        if "CERTIFICATE_VERIFY_FAILED" in str(e):
            raise LLMError(
                "Не удалось проверить сертификат GigaChat. Укажите путь к корневому сертификату "
                "Минцифры в GIGACHAT_CA_BUNDLE (см. backend/README.md)"
            ) from e
        raise LLMError(f"Нет связи с GigaChat: {e!r}") from e


class GigaChatClient:
    name = "gigachat"

    def __init__(self, settings: Settings) -> None:
        if settings.gigachat_auth_key is None:
            raise LLMError("Не задан GIGACHAT_AUTH_KEY в backend/.env")
        ca = settings.gigachat_ca_bundle
        if ca is not None and not ca.is_file():
            raise LLMError(f"Не найден файл сертификата GIGACHAT_CA_BUNDLE: {ca}")
        self._model = settings.gigachat_model
        self._client = GigaChat(
            base_url=settings.gigachat_base_url,
            credentials=settings.gigachat_auth_key.get_secret_value(),
            scope=settings.gigachat_scope,
            model=settings.gigachat_model,
            timeout=settings.gigachat_timeout,
            verify_ssl_certs=settings.gigachat_verify_ssl,
            ca_bundle_file=str(ca) if ca else None,
        )

    def _chat(self, messages: list[LLMMessage], temperature: float | None, max_tokens: int | None) -> Chat:
        return Chat(
            model=self._model,
            messages=[Messages(role=_ROLES[m.role], content=m.content) for m in messages],
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def complete(
        self,
        messages: list[LLMMessage],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str:
        async with _explain_errors():
            response = await self._client.achat(self._chat(messages, temperature, max_tokens))
        return response.choices[0].message.content

    async def stream(
        self,
        messages: list[LLMMessage],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        async with _explain_errors():
            async for chunk in self._client.astream(self._chat(messages, temperature, max_tokens)):
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

    async def list_models(self) -> list[str]:
        async with _explain_errors():
            models = await self._client.aget_models()
        return [m.id_ for m in models.data]

    async def aclose(self) -> None:
        await self._client.aclose()

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal, Protocol


@dataclass(frozen=True)
class LLMMessage:
    role: Literal["system", "user", "assistant"]
    content: str


class LLMError(Exception):
    """Ошибка обращения к LLM с понятным объяснением причины."""


class LLMClient(Protocol):
    """Общий интерфейс провайдеров LLM. Остальной код знает только о нём."""

    name: str

    async def complete(
        self,
        messages: list[LLMMessage],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str: ...

    def stream(
        self,
        messages: list[LLMMessage],
        *,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]: ...

    async def list_models(self) -> list[str]:
        """Дешёвая проверка связи: авторизация и сеть, без расхода токенов."""
        ...

    async def aclose(self) -> None: ...

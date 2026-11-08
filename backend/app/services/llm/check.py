"""Проверка подключения к LLM из консоли.

    python -m app.services.llm.check

Тратит несколько токенов на один короткий ответ.
"""

import asyncio
import sys

from app.services.llm import LLMError, LLMMessage, close_llm, get_llm


async def main() -> int:
    try:
        llm = get_llm()
        models = await llm.list_models()
        print(f"[ok] Подключение к {llm.name}. Доступные модели: {', '.join(models)}")
        answer = await llm.complete(
            [LLMMessage("user", "Ты интервьюер. Задай кандидату один короткий вопрос для начала собеседования.")],
            max_tokens=100,
        )
        print(f"[ok] Тестовый ответ: {answer}")
        return 0
    except LLMError as e:
        print(f"[ошибка] {e}", file=sys.stderr)
        return 1
    finally:
        await close_llm()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

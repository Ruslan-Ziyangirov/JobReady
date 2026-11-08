"""Отправка SMS. Провайдер выбирается настройкой SMS_PROVIDER.

Сейчас есть только console: код печатается в лог сервера. Настоящий провайдер
(SMS.ru, SMSC и т. п.) добавляется отдельным классом с тем же методом send.
"""

import logging
from typing import Protocol

from app.core.config import get_settings

log = logging.getLogger("jobready.sms")


class SmsSender(Protocol):
    async def send(self, phone: str, text: str) -> None: ...


class ConsoleSmsSender:
    async def send(self, phone: str, text: str) -> None:
        # print, а не только log — чтобы код был виден в консоли `fastapi dev` без настройки логов.
        print(f"[SMS → {phone}] {text}", flush=True)
        log.info("SMS to %s: %s", phone, text)


def get_sms_sender() -> SmsSender:
    provider = get_settings().sms_provider
    if provider == "console":
        return ConsoleSmsSender()
    raise RuntimeError(f"Неизвестный SMS_PROVIDER: {provider}")  # pragma: no cover

import re
import uuid
from typing import Annotated

from pydantic import AfterValidator, Field, StringConstraints

from app.schemas.common import CamelModel


def normalize_phone(value: str) -> str:
    """Любая запись российского номера → +7XXXXXXXXXX."""
    digits = re.sub(r"\D", "", value)
    if len(digits) == 11 and digits[0] in "78":
        digits = digits[1:]
    if len(digits) != 10:
        raise ValueError("Нужен российский номер из 10 цифр после +7")
    return "+7" + digits


Phone = Annotated[str, AfterValidator(normalize_phone)]


class SmsRequest(CamelModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    phone: Phone


class SmsResendRequest(CamelModel):
    phone: Phone


class SmsSent(CamelModel):
    # Через сколько секунд можно запросить код снова.
    retry_after: int


class VerifyRequest(CamelModel):
    phone: Phone
    code: Annotated[str, Field(pattern=r"^\d{4}$")]


class UserOut(CamelModel):
    id: uuid.UUID
    name: str
    phone: str
    goal: str | None

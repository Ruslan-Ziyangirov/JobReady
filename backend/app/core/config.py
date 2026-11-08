from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Настройки приложения. Читаются из backend/.env и переменных окружения."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["dev", "prod"] = "dev"

    # SQLite — чтобы запускаться без Docker. Для Postgres:
    # postgresql+asyncpg://jobready:jobready@localhost:5432/jobready
    database_url: str = f"sqlite+aiosqlite:///{(BACKEND_DIR / 'jobready.db').as_posix()}"

    # Откуда фронтенд может ходить в API из браузера.
    cors_origins: list[str] = ["http://localhost:3000"]

    # Подпись кодов из SMS. Без него в dev используется небезопасный запасной ключ.
    secret_key: SecretStr | None = None
    sms_provider: Literal["console"] = "console"
    session_days: int = 30

    llm_provider: Literal["gigachat"] = "gigachat"

    gigachat_auth_key: SecretStr | None = None
    gigachat_scope: str = "GIGACHAT_API_PERS"
    gigachat_model: str = "GigaChat-2"
    # Классический адрес API. На api.giga.chat (по умолчанию в SDK) потоковые ответы
    # приходят одним куском в конце — проверено 08.11.2026.
    gigachat_base_url: str = "https://gigachat.devices.sberbank.ru/api/v1"
    # Путь к корневому сертификату Минцифры (.crt/.pem). Если задан — используется он.
    gigachat_ca_bundle: Path | None = None
    # Выключать проверку сертификатов можно только для локальной разработки.
    gigachat_verify_ssl: bool = True
    gigachat_timeout: float = 60.0

    @property
    def secret(self) -> bytes:
        if self.secret_key is not None:
            return self.secret_key.get_secret_value().encode()
        if self.app_env == "prod":
            raise RuntimeError("SECRET_KEY обязателен при APP_ENV=prod")
        return b"dev-insecure-secret"

    @property
    def secure_cookies(self) -> bool:
        return self.app_env == "prod"

    @field_validator("secret_key", "gigachat_auth_key", "gigachat_ca_bundle", mode="before")
    @classmethod
    def _empty_is_none(cls, v: object) -> object:
        # «GIGACHAT_AUTH_KEY=» в .env означает «не задан».
        return None if isinstance(v, str) and not v.strip() else v

    @field_validator("gigachat_ca_bundle")
    @classmethod
    def _relative_to_backend(cls, v: Path | None) -> Path | None:
        return v if v is None or v.is_absolute() else BACKEND_DIR / v


@lru_cache
def get_settings() -> Settings:
    return Settings()

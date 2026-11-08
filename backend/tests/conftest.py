import json
import re

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.routes.interviews import llm_client
from app.db import models  # noqa: F401 — регистрирует таблицы
from app.db.base import Base
from app.db.session import get_session, get_session_factory
from app.main import app
from app.services.llm import LLMError
from app.services.sms import get_sms_sender


class FakeSms:
    """Запоминает отправленные SMS вместо отправки."""

    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []

    async def send(self, phone: str, text: str) -> None:
        self.sent.append((phone, text))

    def last_code(self) -> str:
        return re.search(r"\d{4}", self.sent[-1][1]).group()


@pytest.fixture
def sms() -> FakeSms:
    return FakeSms()


QUESTIONS = [f"Тестовый вопрос номер {i}?" for i in range(1, 11)]


class FakeLLM:
    """Отвечает заготовками и запоминает, что у неё спросили."""

    name = "fake"

    def __init__(self) -> None:
        self.calls: list[list] = []
        self.questions_reply = json.dumps(QUESTIONS, ensure_ascii=False)
        self.transition = "Понял, спасибо."
        self.followup_parts = ["Расскажи ", "подробнее ", "о своей роли?"]
        self.fail_stream = False

    async def complete(self, messages, *, temperature=None, max_tokens=None) -> str:
        self.calls.append(messages)
        if "составляешь план" in messages[0].content:
            reply = self.questions_reply
            if isinstance(reply, list):  # очередь ответов для проверки повторов
                return reply.pop(0)
            return reply
        return self.transition

    async def stream(self, messages, *, temperature=None, max_tokens=None):
        self.calls.append(messages)
        for i, part in enumerate(self.followup_parts):
            if self.fail_stream and i == 1:
                raise LLMError("обрыв связи")
            yield part

    async def list_models(self):
        return ["fake"]

    async def aclose(self):
        pass


@pytest.fixture
def llm() -> FakeLLM:
    return FakeLLM()


@pytest.fixture
def client(tmp_path, sms, llm):
    """Приложение на отдельной SQLite-базе во временной папке."""
    engine = create_async_engine(f"sqlite+aiosqlite:///{(tmp_path / 'test.db').as_posix()}")
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def create_tables() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def test_session():
        async with sessions() as s:
            yield s

    app.dependency_overrides[get_session] = test_session
    app.dependency_overrides[get_session_factory] = lambda: sessions
    app.dependency_overrides[get_sms_sender] = lambda: sms
    app.dependency_overrides[llm_client] = lambda: llm
    try:
        with TestClient(app) as c:
            c.portal.call(create_tables)
            yield c
            c.portal.call(engine.dispose)
    finally:
        app.dependency_overrides.clear()


def sign_in(client, sms, name="Анна", phone="+79990000001") -> dict:
    client.post("/auth/sms", json={"name": name, "phone": phone})
    r = client.post("/auth/verify", json={"phone": phone, "code": sms.last_code()})
    assert r.status_code == 200
    return r.json()


@pytest.fixture
def user(client, sms) -> dict:
    """Клиент с выполненным входом."""
    return sign_in(client, sms)

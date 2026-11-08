import pytest

from app.api.routes import health
from app.core.config import Settings
from app.services.llm import LLMError
from app.services.llm.gigachat import GigaChatClient

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.parametrize(
    ("path", "camel_keys"),
    [
        ("/interviews/latest/result", {"overall", "marketAverage", "summary", "metrics", "questions"}),
        ("/plan", {"daysLeft", "previousScore", "marketAverage", "days", "topics"}),
        ("/plan/topics/personal", {"yourAnswer", "strongerAnswer", "retryHints"}),
        ("/plan/topics/personal/result", {"before", "after", "previouslyGood", "notImproved"}),
        ("/reference", {"goals", "professions", "grades", "interviewTypes"}),
    ],
)
def test_content_endpoints_use_frontend_shape(client, path, camel_keys):
    r = client.get(path)
    assert r.status_code == 200
    assert camel_keys <= r.json().keys()


def test_question_review_is_camel_case(client):
    q = client.get("/interviews/latest/result").json()["questions"][0]
    assert {"whatWentWrong", "howToImprove"} <= q.keys()
    assert "what_went_wrong" not in q


def test_history(client):
    r = client.get("/history")
    assert r.status_code == 200
    assert r.json()[0].keys() == {"id", "date", "title", "score"}


class FakeLLM:
    name = "fake"

    async def list_models(self):
        return ["GigaChat"]


def test_health_llm_ok(client, monkeypatch):
    monkeypatch.setattr(health, "get_llm", lambda: FakeLLM())
    r = client.get("/health/llm")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "provider": "fake", "models": ["GigaChat"]}


def test_health_llm_reports_error(client, monkeypatch):
    def broken():
        raise LLMError("Не задан GIGACHAT_AUTH_KEY в backend/.env")

    monkeypatch.setattr(health, "get_llm", broken)
    r = client.get("/health/llm")
    assert r.status_code == 503
    assert "GIGACHAT_AUTH_KEY" in r.json()["detail"]


def test_empty_auth_key_is_treated_as_missing():
    settings = Settings(_env_file=None, gigachat_auth_key="  ")
    assert settings.gigachat_auth_key is None
    with pytest.raises(LLMError, match="GIGACHAT_AUTH_KEY"):
        GigaChatClient(settings)


def test_missing_ca_bundle_is_reported():
    settings = Settings(_env_file=None, gigachat_auth_key="x", gigachat_ca_bundle="certs/nope.cer")
    with pytest.raises(LLMError, match="сертификата"):
        GigaChatClient(settings)

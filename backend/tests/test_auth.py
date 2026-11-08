from datetime import timedelta

import pytest

from app.db.models import utcnow
from app.services import auth

PHONE = "+7 (999) 123-45-67"


@pytest.fixture
def clock(monkeypatch):
    """Управляемое «сейчас» для сервиса авторизации."""

    class Clock:
        now = utcnow()

        def shift(self, **kw):
            self.now += timedelta(**kw)

    c = Clock()
    monkeypatch.setattr(auth, "utcnow", lambda: c.now)
    return c


def login(client, sms, name="Анна", phone=PHONE):
    assert client.post("/auth/sms", json={"name": name, "phone": phone}).status_code == 200
    return client.post("/auth/verify", json={"phone": phone, "code": sms.last_code()})


def test_full_login_flow(client, sms):
    r = client.post("/auth/sms", json={"name": "  Анна  ", "phone": PHONE})
    assert r.status_code == 200
    assert r.json() == {"retryAfter": 60}
    assert sms.sent[-1][0] == "+79991234567"

    r = client.post("/auth/verify", json={"phone": PHONE, "code": sms.last_code()})
    assert r.status_code == 200
    assert r.json()["name"] == "Анна"
    assert r.json()["phone"] == "+79991234567"
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie

    assert client.get("/auth/me").json()["name"] == "Анна"

    assert client.post("/auth/logout").status_code == 204
    assert client.get("/auth/me").status_code == 401


def test_me_requires_login(client):
    r = client.get("/auth/me")
    assert r.status_code == 401
    assert r.json()["detail"]["message"] == "Нужно войти"


def test_any_phone_format_is_the_same_user(client, sms, clock):
    first = login(client, sms, phone="8 999 123 45 67").json()
    client.cookies.clear()
    clock.shift(seconds=61)
    second = login(client, sms, name="Другое имя", phone="+79991234567").json()
    assert first["id"] == second["id"]
    # Имя существующего пользователя не перезаписывается формой входа.
    assert second["name"] == "Анна"


@pytest.mark.parametrize(
    "body",
    [
        {"name": "Анна", "phone": "12345"},
        {"name": "Анна", "phone": "+1 202 555 0100"},
        {"name": " А ", "phone": PHONE},
    ],
)
def test_invalid_input(client, body):
    assert client.post("/auth/sms", json=body).status_code == 422


def test_wrong_code_then_lockout(client, sms):
    client.post("/auth/sms", json={"name": "Анна", "phone": PHONE})
    good = sms.last_code()
    bad = "0000" if good != "0000" else "1111"

    r = client.post("/auth/verify", json={"phone": PHONE, "code": bad})
    assert r.status_code == 400
    assert r.json()["detail"] == {"message": "Неверный код", "attemptsLeft": 4}

    for _ in range(4):
        r = client.post("/auth/verify", json={"phone": PHONE, "code": bad})
    assert r.json()["detail"]["message"].startswith("Слишком много попыток")

    # Даже правильный код больше не принимается.
    r = client.post("/auth/verify", json={"phone": PHONE, "code": good})
    assert r.status_code == 400
    assert "attemptsLeft" not in r.json()["detail"]


def test_code_works_only_once(client, sms):
    code = (client.post("/auth/sms", json={"name": "Анна", "phone": PHONE}), sms.last_code())[1]
    assert client.post("/auth/verify", json={"phone": PHONE, "code": code}).status_code == 200
    assert client.post("/auth/verify", json={"phone": PHONE, "code": code}).status_code == 400


def test_code_expires(client, sms, clock):
    client.post("/auth/sms", json={"name": "Анна", "phone": PHONE})
    clock.shift(minutes=5, seconds=1)
    r = client.post("/auth/verify", json={"phone": PHONE, "code": sms.last_code()})
    assert r.status_code == 400
    assert "устарел" in r.json()["detail"]["message"]


def test_resend_waits_and_keeps_name(client, sms, clock):
    client.post("/auth/sms", json={"name": "Анна", "phone": PHONE})

    r = client.post("/auth/sms/resend", json={"phone": PHONE})
    assert r.status_code == 429
    assert 1 <= r.json()["detail"]["retryAfter"] <= 60
    assert len(sms.sent) == 1

    clock.shift(seconds=61)
    assert client.post("/auth/sms/resend", json={"phone": PHONE}).status_code == 200
    assert len(sms.sent) == 2
    # Действует только последний код, имя взято из первого запроса.
    r = client.post("/auth/verify", json={"phone": PHONE, "code": sms.last_code()})
    assert r.json()["name"] == "Анна"


def test_resend_without_prior_request(client):
    r = client.post("/auth/sms/resend", json={"phone": PHONE})
    assert r.status_code == 400


def test_hourly_limit(client, sms, clock):
    for _ in range(5):
        assert client.post("/auth/sms", json={"name": "Анна", "phone": PHONE}).status_code == 200
        clock.shift(seconds=61)
    r = client.post("/auth/sms", json={"name": "Анна", "phone": PHONE})
    assert r.status_code == 429
    assert r.json()["detail"]["message"].startswith("Слишком много запросов")

    clock.shift(hours=1)
    assert client.post("/auth/sms", json={"name": "Анна", "phone": PHONE}).status_code == 200


def test_session_expires(client, sms, clock):
    login(client, sms)
    clock.shift(days=31)
    assert client.get("/auth/me").status_code == 401

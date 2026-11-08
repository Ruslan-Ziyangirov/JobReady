import json

import pytest

from app.services.interview_prompts import FALLBACK_TRANSITION, FINISH_TEXT, parse_questions
from tests.conftest import QUESTIONS, sign_in

SETUP = {"profession": "product-designer", "grade": "middle", "type": "tech", "goal": "first-interview"}


def events(response) -> list[dict]:
    return [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]


def start(client) -> dict:
    r = client.post("/interviews", json=SETUP)
    assert r.status_code == 201, r.text
    return r.json()


def answer(client, interview_id: str, text: str = "Мой ответ") -> list[dict]:
    r = client.post(f"/interviews/{interview_id}/messages", json={"text": text})
    assert r.status_code == 200, r.text
    assert r.headers["content-type"].startswith("text/event-stream")
    return events(r)


def test_requires_login(client):
    assert client.post("/interviews", json=SETUP).status_code == 401


def test_start_interview(client, user, llm):
    state = start(client)
    assert state["status"] == "in-progress"
    assert state["totalQuestions"] == 10
    assert state["currentQuestion"] == 1
    assert state["currentQuestionText"] == QUESTIONS[0]
    assert (state["professionLabel"], state["gradeLabel"], state["typeLabel"]) == (
        "Product Designer",
        "Middle",
        "Техническое",
    )
    [greeting] = state["messages"]
    assert greeting["role"] == "ai"
    assert "Анна" in greeting["text"] and greeting["text"].endswith(QUESTIONS[0])
    # Цель и параметры попали в промпт вопросов.
    prompt = llm.calls[0][1].content
    assert "Product Designer" in prompt and "первому собеседованию" in prompt
    # И сохранились в профиле.
    assert client.get("/auth/me").json()["goal"] == "first-interview"


def test_unknown_option_rejected(client, user):
    r = client.post("/interviews", json={**SETUP, "profession": "astronaut"})
    assert r.status_code == 422
    assert "astronaut" in r.json()["detail"]["message"]


def test_questions_retry_then_fail(client, user, llm):
    llm.questions_reply = ["не тот формат", json.dumps(QUESTIONS, ensure_ascii=False)]
    assert start(client)["totalQuestions"] == 10

    llm.questions_reply = ["мусор", "снова мусор"]
    r = client.post("/interviews", json=SETUP)
    assert r.status_code == 502


def test_followup_is_streamed_and_saved(client, user, llm):
    iid = start(client)["id"]
    evs = answer(client, iid, "Я делал редизайн онбординга")

    deltas = [e["text"] for e in evs if e["type"] == "delta"]
    assert deltas == llm.followup_parts
    done = evs[-1]
    assert done["type"] == "done"
    state = done["state"]
    assert state["currentQuestion"] == 1  # уточнение — тот же вопрос
    assert [m["role"] for m in state["messages"]] == ["ai", "user", "ai"]
    assert state["messages"][1]["text"] == "Я делал редизайн онбординга"
    assert state["messages"][2]["text"] == "Расскажи подробнее о своей роли?"

    # Модель получила историю и задачу уточнить именно текущий вопрос.
    turn = llm.calls[-1]
    assert turn[0].role == "system" and QUESTIONS[0] in turn[0].content
    assert turn[-1].content == "Я делал редизайн онбординга"


def test_second_answer_moves_to_next_question(client, user):
    iid = start(client)["id"]
    answer(client, iid)
    evs = answer(client, iid)
    state = evs[-1]["state"]
    assert state["currentQuestion"] == 2
    assert state["messages"][-1]["text"] == f"Понял, спасибо.\n\n{QUESTIONS[1]}"


def test_transition_with_question_is_replaced(client, user, llm):
    llm.transition = "Отлично! А как ты оцениваешь свой ответ?"
    iid = start(client)["id"]
    answer(client, iid)
    last = answer(client, iid)[-1]["state"]["messages"][-1]["text"]
    assert last == f"{FALLBACK_TRANSITION}\n\n{QUESTIONS[1]}"


def test_full_interview(client, user):
    iid = start(client)["id"]
    for _ in range(10):
        answer(client, iid)
        state = answer(client, iid)[-1]["state"]
    assert state["status"] == "finished"
    assert state["currentQuestion"] == 10
    assert state["currentQuestionText"] is None
    assert state["messages"][-1]["text"] == FINISH_TEXT
    assert len(state["messages"]) == 1 + 10 * 4

    r = client.post(f"/interviews/{iid}/messages", json={"text": "ещё"})
    assert r.status_code == 409


def test_llm_failure_saves_nothing(client, user, llm):
    iid = start(client)["id"]
    llm.fail_stream = True
    evs = answer(client, iid)
    assert evs[-1]["type"] == "error"
    assert "ещё раз" in evs[-1]["message"]
    state = client.get(f"/interviews/{iid}").json()
    assert len(state["messages"]) == 1

    llm.fail_stream = False
    assert answer(client, iid)[-1]["type"] == "done"


def test_skip(client, user):
    iid = start(client)["id"]
    state = client.post(f"/interviews/{iid}/skip").json()
    assert state["currentQuestion"] == 2
    assert state["messages"][-1]["text"].endswith(QUESTIONS[1])

    for _ in range(8):
        state = client.post(f"/interviews/{iid}/skip").json()
    assert state["currentQuestion"] == 10
    state = client.post(f"/interviews/{iid}/skip").json()
    assert state["status"] == "finished"
    assert client.post(f"/interviews/{iid}/skip").status_code == 409


def test_empty_answer_rejected(client, user):
    iid = start(client)["id"]
    assert client.post(f"/interviews/{iid}/messages", json={"text": "   "}).status_code == 422


def test_other_users_interview_is_hidden(client, user, sms, monkeypatch):
    iid = start(client)["id"]
    client.cookies.clear()
    sign_in(client, sms, name="Борис", phone="+79990000002")
    assert client.get(f"/interviews/{iid}").status_code == 404
    assert client.post(f"/interviews/{iid}/messages", json={"text": "x"}).status_code == 404
    assert client.get("/interviews/not-a-uuid").status_code == 404


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ('```json\n["Вопрос один?", "Вопрос два?"]\n```', ["Вопрос один?", "Вопрос два?"]),
        ("1. Расскажи о себе?\n2) Какой у тебя опыт?\nСпасибо!", ["Расскажи о себе?", "Какой у тебя опыт?"]),
        ("ничего полезного", []),
    ],
)
def test_parse_questions(text, expected):
    assert parse_questions(text, 10) == expected

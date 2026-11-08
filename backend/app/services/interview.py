"""Логика пробного интервью.

Ход интервью ведёт бэкенд, а не модель: на каждый вопрос — один ответ, одно
уточнение от модели, второй ответ, затем переход к следующему вопросу. Так
длина интервью и прогресс предсказуемы, а модель отвечает только за тексты.
"""

import json
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from app import mocks
from app.db.models import Interview, InterviewMessage, User, utcnow
from app.schemas.interview import ChatMessage, InterviewCreate, InterviewState
from app.services import interview_prompts as prompts
from app.services.llm import LLMClient, LLMError, LLMMessage

TOTAL_QUESTIONS = 10
MIN_QUESTIONS = 5
FOLLOWUPS_PER_QUESTION = 1
REPLY_MAX_TOKENS = 300


class InterviewError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def _label(options, option_id: str, what: str) -> str:
    for o in options:
        if o.id == option_id:
            return o.label
    raise InterviewError(422, f"Неизвестное значение «{option_id}» для поля {what}")


@dataclass(frozen=True)
class Labels:
    profession: str
    grade: str
    type: str


def labels_for(profession: str, grade: str, type_id: str) -> Labels:
    ref = mocks.reference
    return Labels(
        profession=_label(ref.professions, profession, "profession"),
        grade=_label(ref.grades, grade, "grade"),
        type=_label(ref.interview_types, type_id, "type"),
    )


def to_state(interview: Interview) -> InterviewState:
    lb = labels_for(interview.profession, interview.grade, interview.type)
    total = len(interview.questions)
    finished = interview.status == "finished"
    return InterviewState(
        id=str(interview.id),
        profession=interview.profession,
        grade=interview.grade,
        type=interview.type,
        profession_label=lb.profession,
        grade_label=lb.grade,
        type_label=lb.type,
        status=interview.status,
        total_questions=total,
        current_question=total if finished else interview.current_question + 1,
        current_question_text=None if finished else interview.questions[interview.current_question],
        messages=[ChatMessage(id=str(m.id), role=m.role, text=m.text) for m in interview.messages],
    )


async def create_interview(db: AsyncSession, llm: LLMClient, user: User, body: InterviewCreate) -> Interview:
    lb = labels_for(body.profession, body.grade, body.type)
    if body.goal is not None and body.goal not in prompts.GOAL_HINTS:
        raise InterviewError(422, f"Неизвестная цель «{body.goal}»")

    request = prompts.questions_prompt(lb.profession, lb.grade, body.type, lb.type, body.goal, TOTAL_QUESTIONS)
    questions: list[str] = []
    for _ in range(2):  # модель иногда отвечает не в формате — даём второй шанс
        text = await llm.complete(request, max_tokens=1500)
        questions = prompts.parse_questions(text, TOTAL_QUESTIONS)
        if len(questions) >= MIN_QUESTIONS:
            break
    else:
        raise InterviewError(502, "Не удалось подготовить вопросы. Попробуйте ещё раз")

    interview = Interview(
        user_id=user.id,
        profession=body.profession,
        grade=body.grade,
        type=body.type,
        goal=body.goal,
        questions=questions,
    )
    db.add(interview)
    if body.goal:
        user.goal = body.goal
    await db.flush()
    db.add(
        InterviewMessage(
            interview_id=interview.id,
            role="ai",
            text=prompts.greeting(user.name, lb.profession, lb.grade, lb.type, len(questions), questions[0]),
        )
    )
    await db.commit()
    return await get_interview(db, user.id, interview.id)


async def get_interview(db: AsyncSession, user_id: uuid.UUID, interview_id: uuid.UUID | str) -> Interview:
    try:
        iid = interview_id if isinstance(interview_id, uuid.UUID) else uuid.UUID(interview_id)
    except ValueError:
        raise InterviewError(404, "Интервью не найдено") from None
    interview = await db.scalar(
        select(Interview)
        .where(Interview.id == iid, Interview.user_id == user_id)
        .options(selectinload(Interview.messages))
        .execution_options(populate_existing=True)
    )
    if interview is None:
        raise InterviewError(404, "Интервью не найдено")
    return interview


def ensure_in_progress(interview: Interview) -> None:
    if interview.status != "in-progress":
        raise InterviewError(409, "Интервью уже завершено")


Step = Literal["followup", "next", "finish"]


def next_step(interview: Interview) -> Step:
    if interview.followups < FOLLOWUPS_PER_QUESTION:
        return "followup"
    if interview.current_question + 1 < len(interview.questions):
        return "next"
    return "finish"


def _advance(interview: Interview, step: Step) -> None:
    if step == "followup":
        interview.followups += 1
    elif step == "next":
        interview.current_question += 1
        interview.followups = 0
    else:
        interview.status = "finished"
        interview.finished_at = utcnow()


def _history(interview: Interview, answer: str) -> list[LLMMessage]:
    roles = {"ai": "assistant", "user": "user"}
    return [LLMMessage(roles[m.role], m.text) for m in interview.messages] + [LLMMessage("user", answer)]


def sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


async def answer_events(
    sessions: async_sessionmaker[AsyncSession],
    llm: LLMClient,
    user_id: uuid.UUID,
    interview_id: str,
    answer: str,
) -> AsyncIterator[str]:
    """Поток SSE-событий: delta (кусок ответа) … done (новое состояние) или error.

    Ответ кандидата и реплика интервьюера сохраняются вместе и только после того,
    как реплика получена полностью. Если поток оборвался, в БД ничего не меняется
    и ответ можно отправить заново.
    """
    async with sessions() as db:
        try:
            interview = await get_interview(db, user_id, interview_id)
            ensure_in_progress(interview)
        except InterviewError as e:
            yield sse({"type": "error", "message": e.message})
            return

        answered_at = utcnow()
        step = next_step(interview)
        lb = labels_for(interview.profession, interview.grade, interview.type)
        system = prompts.interviewer_system(lb.profession, lb.grade, lb.type)
        history = _history(interview, answer)
        question = interview.questions[interview.current_question]

        try:
            if step == "followup":
                parts: list[str] = []
                turn = prompts.build_turn(system, prompts.followup_task(question), history)
                async for delta in llm.stream(turn, max_tokens=REPLY_MAX_TOKENS):
                    parts.append(delta)
                    yield sse({"type": "delta", "text": delta})
                reply = "".join(parts).strip()
                if not reply:
                    reply = "Можешь рассказать чуть подробнее?"
                    yield sse({"type": "delta", "text": reply})
            elif step == "next":
                # Связку не стримим: она короткая, а её нужно проверить до показа.
                turn = prompts.build_turn(system, prompts.transition_task(), history)
                transition = prompts.clean_transition(await llm.complete(turn, max_tokens=60))
                reply = f"{transition}\n\n{interview.questions[interview.current_question + 1]}"
                yield sse({"type": "delta", "text": reply})
            else:
                reply = prompts.FINISH_TEXT
                yield sse({"type": "delta", "text": reply})
        except LLMError as e:
            yield sse({"type": "error", "message": f"Интервьюер не смог ответить. Попробуйте отправить ещё раз. ({e})"})
            return

        db.add(InterviewMessage(interview_id=interview.id, role="user", text=answer, created_at=answered_at))
        db.add(InterviewMessage(interview_id=interview.id, role="ai", text=reply, created_at=utcnow()))
        _advance(interview, step)
        await db.commit()

        interview = await get_interview(db, user_id, interview.id)
        yield sse({"type": "done", "state": to_state(interview).model_dump(by_alias=True, mode="json")})


async def skip_question(db: AsyncSession, interview: Interview) -> Interview:
    ensure_in_progress(interview)
    if interview.current_question + 1 < len(interview.questions):
        _advance(interview, "next")
        text = prompts.skip_text(interview.questions[interview.current_question])
    else:
        _advance(interview, "finish")
        text = prompts.FINISH_TEXT
    db.add(InterviewMessage(interview_id=interview.id, role="ai", text=text))
    await db.commit()
    return await get_interview(db, interview.user_id, interview.id)

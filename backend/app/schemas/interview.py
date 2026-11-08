from typing import Annotated, Literal

from pydantic import Field, StringConstraints

from app.schemas.common import CamelModel

Score = Annotated[float, Field(ge=0, le=10)]
ScoreTone = Literal["orange", "blue", "purple", "green"]


class ChatMessage(CamelModel):
    id: str
    role: Literal["ai", "user"]
    text: str


class Metric(CamelModel):
    id: str
    label: str
    value: Score
    market: Score
    tone: ScoreTone


class QuestionReview(CamelModel):
    id: str
    index: int
    question: str
    score: Score
    what_went_wrong: str
    how_to_improve: str


class InterviewResult(CamelModel):
    overall: Score
    market_average: Score
    summary: str
    metrics: list[Metric]
    strengths: list[str]
    weaknesses: list[str]
    questions: list[QuestionReview]


class InterviewCreate(CamelModel):
    profession: str
    grade: str
    type: str
    goal: str | None = None


class InterviewState(CamelModel):
    id: str
    profession: str
    grade: str
    type: str
    profession_label: str
    grade_label: str
    type_label: str
    status: Literal["in-progress", "finished"]
    total_questions: int
    # Номер текущего вопроса с единицы; после завершения равен total_questions.
    current_question: int
    current_question_text: str | None
    messages: list[ChatMessage]


class AnswerIn(CamelModel):
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]


class HistoryItem(CamelModel):
    id: str
    date: str
    title: str
    score: Score

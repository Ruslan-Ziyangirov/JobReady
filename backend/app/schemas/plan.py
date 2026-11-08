from typing import Literal

from app.schemas.common import CamelModel
from app.schemas.interview import Score

TopicStatus = Literal["in-progress", "soon", "done"]


class PlanDay(CamelModel):
    id: str
    day: int
    title: str


class PlanTopic(CamelModel):
    id: str
    title: str
    day: int
    status: TopicStatus


class Plan(CamelModel):
    days_left: int
    previous_score: Score
    market_average: Score
    days: list[PlanDay]
    topics: list[PlanTopic]


class Problem(CamelModel):
    id: str
    title: str
    illustration: str
    done: bool


class TopicPractice(CamelModel):
    id: str
    title: str
    description: str
    your_answer: str
    stronger_answer: str
    retry_hints: list[str]


class PracticeResult(CamelModel):
    before: Score
    after: Score
    previously_good: list[str]
    improved: list[str]
    not_improved: list[str]

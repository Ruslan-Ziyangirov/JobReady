from typing import Literal

from app.schemas.common import CamelModel

GoalId = Literal["first-interview", "check-knowledge", "interview-review", "target-vacancy"]


class Goal(CamelModel):
    id: GoalId
    title: str
    illustration: str


class Option(CamelModel):
    id: str
    label: str


class Reference(CamelModel):
    """Справочники для онбординга и настройки интервью."""

    goals: list[Goal]
    professions: list[Option]
    grades: list[Option]
    interview_types: list[Option]

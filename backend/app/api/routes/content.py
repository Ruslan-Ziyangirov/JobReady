"""Эндпоинты, которые фронтенд уже вызывает через frontend/lib/api.ts.

Пока отдают мок-данные; пути и форма ответов — окончательные.
"""

from fastapi import APIRouter

from app import mocks
from app.schemas.interview import HistoryItem, InterviewResult
from app.schemas.plan import Plan, PracticeResult, TopicPractice
from app.schemas.reference import Reference

router = APIRouter()


@router.get("/reference", response_model=Reference, tags=["reference"])
async def get_reference() -> Reference:
    """Цели, профессии, грейды и типы интервью."""
    return mocks.reference


@router.get("/interviews/{interview_id}/result", response_model=InterviewResult, tags=["interviews"])
async def get_interview_result(interview_id: str) -> InterviewResult:
    # TODO: брать разбор из interview_results; "latest" — последнее интервью пользователя.
    return mocks.interview_result


@router.get("/history", response_model=list[HistoryItem], tags=["interviews"])
async def get_history() -> list[HistoryItem]:
    return mocks.history


@router.get("/plan", response_model=Plan, tags=["plan"])
async def get_plan() -> Plan:
    return mocks.plan


@router.get("/plan/topics/{topic_id}", response_model=TopicPractice, tags=["plan"])
async def get_topic_practice(topic_id: str) -> TopicPractice:
    return mocks.topic_practice


@router.get("/plan/topics/{topic_id}/result", response_model=PracticeResult, tags=["plan"])
async def get_practice_result(topic_id: str) -> PracticeResult:
    return mocks.practice_result

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.api.deps import current_user
from app.db.models import User
from app.db.session import get_session, get_session_factory
from app.schemas.interview import AnswerIn, InterviewCreate, InterviewState
from app.services import interview as service
from app.services.llm import LLMClient, LLMError, get_llm

router = APIRouter(prefix="/interviews", tags=["interviews"])


def llm_client() -> LLMClient:
    try:
        return get_llm()
    except LLMError as e:
        raise HTTPException(status_code=503, detail={"message": str(e)}) from e


def _http_error(e: service.InterviewError) -> HTTPException:
    return HTTPException(status_code=e.status, detail={"message": e.message})


@router.post("", response_model=InterviewState, status_code=201)
async def create_interview(
    body: InterviewCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
    llm: LLMClient = Depends(llm_client),
) -> InterviewState:
    """Начать интервью: модель готовит вопросы, интервьюер здоровается и задаёт первый."""
    try:
        interview = await service.create_interview(db, llm, user, body)
    except service.InterviewError as e:
        raise _http_error(e) from e
    except LLMError as e:
        raise HTTPException(status_code=502, detail={"message": f"Не удалось подготовить вопросы: {e}"}) from e
    return service.to_state(interview)


@router.get("/{interview_id}", response_model=InterviewState)
async def get_interview(
    interview_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
) -> InterviewState:
    try:
        return service.to_state(await service.get_interview(db, user.id, interview_id))
    except service.InterviewError as e:
        raise _http_error(e) from e


@router.post("/{interview_id}/messages")
async def send_answer(
    interview_id: str,
    body: AnswerIn,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
    sessions: async_sessionmaker[AsyncSession] = Depends(get_session_factory),
    llm: LLMClient = Depends(llm_client),
) -> StreamingResponse:
    """Ответ кандидата. Реплика интервьюера приходит потоком SSE.

    События (каждое — `data: {json}`):
    - `{"type": "delta", "text": "..."}` — очередной кусок реплики;
    - `{"type": "done", "state": {...}}` — реплика сохранена, новое состояние интервью;
    - `{"type": "error", "message": "..."}` — ошибка, ничего не сохранено, ответ можно отправить снова.
    """
    try:
        service.ensure_in_progress(await service.get_interview(db, user.id, interview_id))
    except service.InterviewError as e:
        raise _http_error(e) from e

    return StreamingResponse(
        service.answer_events(sessions, llm, user.id, interview_id, body.text),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/{interview_id}/skip", response_model=InterviewState)
async def skip_question(
    interview_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
) -> InterviewState:
    try:
        interview = await service.get_interview(db, user.id, interview_id)
        return service.to_state(await service.skip_question(db, interview))
    except service.InterviewError as e:
        raise _http_error(e) from e

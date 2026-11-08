# JobReady — бэкенд

FastAPI + SQLAlchemy + GigaChat. Готово: каркас, база данных, вход по SMS, пробное интервью с GigaChat. Разбор интервью и план пока отдают мок-данные.

## Первый запуск

Нужен Python 3.12+. Команды выполняются в папке `backend`.

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows; на macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
alembic upgrade head            # создать таблицы
fastapi dev app/main.py         # сервер на http://localhost:8000
```

- http://localhost:8000/docs — документация API, каждый запрос можно попробовать в браузере
- http://localhost:8000/health — сервер и БД живы
- http://localhost:8000/health/llm — есть ли связь с GigaChat

Чтобы фронтенд брал данные из бэкенда, в `frontend/.env.local` укажите `NEXT_PUBLIC_API_URL=http://localhost:8000`.

Тесты: `pytest`

## GigaChat

1. Вставьте ключ авторизации из личного кабинета Сбера в `.env`: `GIGACHAT_AUTH_KEY=...`
2. Положите корневой сертификат Минцифры (см. ниже) и пропишите путь в `GIGACHAT_CA_BUNDLE`.
3. Проверьте связь — команда задаст GigaChat тестовый вопрос:

```bash
python -m app.services.llm.check
```

### Сертификат GigaChat

Серверы GigaChat используют сертификат российского удостоверяющего центра (Минцифры), которого нет в стандартных хранилищах. Без него запросы падают с ошибкой проверки сертификата.

1. Скачайте «Корневой сертификат» на странице Госуслуг https://www.gosuslugi.ru/crt (файл `russian_trusted_root_ca.cer`). Ссылки на него есть и в документации GigaChat API.
2. Положите его в `backend/certs/` (папка не попадает в git).
3. В `.env`: `GIGACHAT_CA_BUNDLE=certs/russian_trusted_root_ca.cer`

`GIGACHAT_VERIFY_SSL=false` отключает проверку сертификатов совсем — так можно быстро проверить ключ на своём компьютере, но не на сервере.

## Вход по SMS

1. `POST /auth/sms` `{name, phone}` — создаёт 4-значный код и отправляет его.
2. `POST /auth/verify` `{phone, code}` — проверяет код, создаёт пользователя (если новый) и ставит httpOnly-cookie `session` на 30 дней.
3. `GET /auth/me` — текущий пользователь, `POST /auth/logout` — выход.

Пока `SMS_PROVIDER=console`: SMS не отправляются, код печатается в консоль сервера — строка вида `[SMS → +79990000001] JobReady: код для входа 1234`.

Защита от перебора: код живёт 5 минут, 5 попыток ввода, повторная отправка не раньше чем через 60 секунд, не больше 5 кодов в час на номер. В базе хранится не сам код, а его HMAC (`SECRET_KEY` в `.env`).

Чтобы закрыть эндпоинт от неавторизованных, добавьте зависимость `user: User = Depends(current_user)` из `app/api/deps.py`.

Настоящие SMS платные (обычно несколько рублей за сообщение). Провайдер подключается отдельным классом в `app/services/sms.py`.

## Интервью

1. `POST /interviews` `{profession, grade, type, goal}` — GigaChat составляет 10 вопросов, интервьюер здоровается и задаёт первый.
2. `POST /interviews/{id}/messages` `{text}` — ответ кандидата. Реплика интервьюера приходит потоком SSE: события `delta` (кусок текста), затем `done` (новое состояние) или `error`.
3. `POST /interviews/{id}/skip` — пропустить вопрос, `GET /interviews/{id}` — состояние и вся переписка.

Ход интервью ведёт бэкенд: на каждый вопрос — ответ, одно уточнение от модели, второй ответ, затем короткая связка и следующий вопрос из плана. Модель отвечает только за тексты.

- Промпты — в `app/services/interview_prompts.py`, их удобно править отдельно от логики.
- Ответ и реплика сохраняются вместе и только когда реплика получена целиком. Если связь оборвалась, ответ можно отправить заново — обрывков в истории не будет.
- Связку перед следующим вопросом модель иногда превращает в ещё один вопрос — такая связка заменяется на нейтральное «Понял, спасибо.».
- Потоковые ответы идут через `gigachat.devices.sberbank.ru` (`GIGACHAT_BASE_URL`): на адресе `api.giga.chat`, который SDK использует по умолчанию, поток приходил одним куском в конце.

## База данных

По умолчанию — файл SQLite `jobready.db`, ничего устанавливать не нужно. Для продакшена — PostgreSQL:

```bash
docker compose up -d            # нужен Docker Desktop
```

и в `.env`: `DATABASE_URL=postgresql+asyncpg://jobready:jobready@localhost:5432/jobready`, затем `alembic upgrade head`.

После изменения моделей в `app/db/models.py`: `alembic revision --autogenerate -m "что изменилось"` → проверить файл в `alembic/versions` → `alembic upgrade head`.

## Структура

```
app/
  main.py              приложение, CORS, подключение роутеров
  core/config.py       настройки из .env
  db/                  модели таблиц и сессия БД
  schemas/             формы запросов и ответов — зеркало frontend/lib/types.ts (JSON в camelCase)
  api/routes/          эндпоинты
  services/interview*.py  ход интервью и промпты интервьюера
  services/auth.py     коды из SMS и сессии
  services/sms.py      отправка SMS (сейчас — в консоль)
  services/llm/        доступ к LLM: общий интерфейс + реализация GigaChat
  mocks.py             мок-данные, пока нет настоящей логики
alembic/               миграции БД
tests/
```

Провайдер LLM выбирается настройкой `LLM_PROVIDER`. Остальной код работает только через интерфейс из `services/llm/base.py`, поэтому YandexGPT или другую модель можно добавить, не трогая логику интервью.

## Эндпоинты

| Метод и путь | Что отдаёт | Сейчас |
|---|---|---|
| `GET /reference` | цели, профессии, грейды, типы интервью | моки |
| `POST /interviews`, `GET /interviews/{id}`, `POST /interviews/{id}/messages` (SSE), `POST /interviews/{id}/skip` | пробное интервью | работают |
| `GET /interviews/{id}/result` | разбор интервью | моки |
| `GET /history` | история интервью | моки |
| `GET /plan` | план подготовки | моки |
| `GET /plan/topics/{id}` | проработка темы | моки |
| `GET /plan/topics/{id}/result` | результат проработки | моки |
| `POST /auth/sms`, `/auth/sms/resend`, `/auth/verify`, `/auth/logout`, `GET /auth/me` | вход по SMS | работают |
| `GET /health`, `GET /health/llm` | проверки | работают |

## Дальше

- Оценка интервью и построение плана моделью
- Подключить настоящего SMS-провайдера
- Закрыть страницы приложения для неавторизованных (сейчас они открываются без входа)

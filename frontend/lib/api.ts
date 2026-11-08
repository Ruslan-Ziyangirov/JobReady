// Единая точка доступа к данным.
// Без NEXT_PUBLIC_API_URL работает на мок-данных; с ним — ходит в FastAPI.

import * as mock from "./mock-data";
import type {
  GoalId,
  InterviewResult,
  InterviewSetup,
  InterviewState,
  Plan,
  PracticeResult,
  TopicPractice,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Ошибка API с текстом для пользователя (detail.message из FastAPI). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
    public attemptsLeft?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, fallback: T): Promise<T> {
  if (!API_URL) return fallback;
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** POST из браузера: с cookie сессии и понятными ошибками. */
async function post<T>(path: string, body: unknown, fallback: T): Promise<T> {
  if (!API_URL) return fallback;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const message =
      typeof detail?.message === "string"
        ? detail.message
        : res.status === 422
          ? "Проверьте введённые данные"
          : "Что-то пошло не так. Попробуйте ещё раз";
    throw new ApiError(res.status, message, detail?.retryAfter, detail?.attemptsLeft);
  }
  return data as T;
}

export const api = {
  getInterviewResult: (id = "latest") => request<InterviewResult>(`/interviews/${id}/result`, mock.interviewResult),
  getPlan: () => request<Plan>("/plan", mock.plan),
  getTopicPractice: (id: string) => request<TopicPractice>(`/plan/topics/${id}`, mock.topicPractice),
  getPracticeResult: (id: string) => request<PracticeResult>(`/plan/topics/${id}/result`, mock.practiceResult),
};

/** GET из браузера с cookie сессии. */
async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { credentials: "include", cache: "no-store" });
  } catch {
    throw new ApiError(0, "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.detail?.message ?? "Что-то пошло не так. Попробуйте ещё раз");
  return data as T;
}

/** true, если фронтенд подключён к бэкенду (иначе — демо на моках). */
export const hasBackend = Boolean(API_URL);

export const interviews = {
  create: (setup: InterviewSetup & { goal?: GoalId | null }) =>
    post<InterviewState>("/interviews", setup, undefined as never),
  get: (id: string) => get<InterviewState>(`/interviews/${id}`),
  skip: (id: string) => post<InterviewState>(`/interviews/${id}/skip`, {}, undefined as never),

  /**
   * Отправить ответ. Реплика интервьюера приходит потоком: onDelta вызывается
   * на каждый кусок текста, промис возвращает новое состояние интервью.
   */
  async answer(id: string, text: string, onDelta: (chunk: string) => void): Promise<InterviewState> {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/interviews/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
    } catch {
      throw new ApiError(0, "Нет связи с сервером. Ответ не отправлен — попробуйте ещё раз");
    }
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => null);
      throw new ApiError(res.status, data?.detail?.message ?? "Не удалось отправить ответ. Попробуйте ещё раз");
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        if (!raw.startsWith("data: ")) continue;
        const event = JSON.parse(raw.slice(6)) as InterviewEvent;
        if (event.type === "delta") onDelta(event.text);
        else if (event.type === "done") return event.state;
        else throw new ApiError(500, event.message);
      }
    }
    throw new ApiError(0, "Связь прервалась. Ответ не сохранён — попробуйте отправить ещё раз");
  },
};

type InterviewEvent =
  | { type: "delta"; text: string }
  | { type: "done"; state: InterviewState }
  | { type: "error"; message: string };

const mockUser: User = { id: "mock", name: mock.user.name, phone: "+70000000000", goal: null };

export const auth = {
  /** Отправить код. Возвращает, через сколько секунд можно запросить снова. */
  requestCode: (name: string, phone: string) =>
    post<{ retryAfter: number }>("/auth/sms", { name, phone }, { retryAfter: 60 }),
  resendCode: (phone: string) => post<{ retryAfter: number }>("/auth/sms/resend", { phone }, { retryAfter: 60 }),
  verify: (phone: string, code: string) => post<User>("/auth/verify", { phone, code }, mockUser),
  logout: () => post<void>("/auth/logout", {}, undefined),
};

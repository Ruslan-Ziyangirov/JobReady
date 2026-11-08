"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, interviews } from "@/lib/api";
import { aiFollowUps, initialChat, interviewQuestions } from "@/lib/mock-data";
import type { ChatMessage, InterviewState } from "@/lib/types";

/** Всё, что нужно экрану интервью, независимо от источника данных. */
export type InterviewView = {
  /** Пока null — идёт загрузка. */
  ready: boolean;
  fatalError: string | null;
  tags: string[];
  total: number;
  current: number;
  questionText: string | null;
  finished: boolean;
  messages: ChatMessage[];
  /** Интервьюер «печатает» — ответ отправлен, текста ещё нет. */
  typing: boolean;
  /** Нельзя отправлять: ждём ответ или пропуск. */
  busy: boolean;
  error: string | null;
  canRetry: boolean;
  send: (text: string) => void;
  retry: () => void;
  skip: () => void;
};

const message = (role: ChatMessage["role"], text: string): ChatMessage => ({ id: crypto.randomUUID(), role, text });

/** Настоящее интервью: бэкенд + GigaChat, ответы интервьюера приходят потоком. */
export function useLiveInterview(id: string | undefined): InterviewView {
  const [state, setState] = useState<InterviewState | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(id ? null : "Интервью не выбрано");
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [streamed, setStreamed] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAnswer, setFailedAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    interviews
      .get(id)
      .then(setState)
      .catch((e) =>
        setFatalError(
          e instanceof ApiError && e.status === 401
            ? "Чтобы продолжить интервью, нужно войти"
            : e instanceof ApiError
              ? e.message
              : "Не удалось загрузить интервью",
        ),
      );
  }, [id]);

  const send = useCallback(
    async (text: string) => {
      if (!id || busy) return;
      setBusy(true);
      setError(null);
      setFailedAnswer(null);
      setPendingAnswer(text);
      setStreamed("");
      try {
        const next = await interviews.answer(id, text, (chunk) => setStreamed((s) => s + chunk));
        setState(next);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Не удалось отправить ответ");
        setFailedAnswer(text);
      } finally {
        setPendingAnswer(null);
        setStreamed("");
        setBusy(false);
      }
    },
    [id, busy],
  );

  const skip = useCallback(async () => {
    if (!id || busy) return;
    setBusy(true);
    setError(null);
    setFailedAnswer(null);
    try {
      setState(await interviews.skip(id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось пропустить вопрос");
    } finally {
      setBusy(false);
    }
  }, [id, busy]);

  const messages = [...(state?.messages ?? [])];
  if (pendingAnswer) messages.push({ id: "pending-user", role: "user", text: pendingAnswer });
  if (streamed) messages.push({ id: "pending-ai", role: "ai", text: streamed });

  return {
    ready: state !== null,
    fatalError,
    tags: state ? [state.gradeLabel, state.professionLabel, state.typeLabel] : [],
    total: state?.totalQuestions ?? 0,
    current: state?.currentQuestion ?? 0,
    questionText: state?.currentQuestionText ?? null,
    finished: state?.status === "finished",
    messages,
    typing: busy && pendingAnswer !== null && !streamed,
    busy,
    error,
    canRetry: failedAnswer !== null,
    send,
    retry: () => failedAnswer && send(failedAnswer),
    skip,
  };
}

const MOCK_TOTAL = 10;

/** Демо без бэкенда: заготовленные реплики по таймеру. */
export function useMockInterview(): InterviewView {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [questionNo, setQuestionNo] = useState(1);
  const [typing, setTyping] = useState(false);
  const [followUp, setFollowUp] = useState(1);
  const finished = questionNo > MOCK_TOTAL;

  function aiSay(text: string, delay = 1200) {
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, message("ai", text)]);
      setTyping(false);
    }, delay);
  }

  function nextQuestion() {
    const next = questionNo + 1;
    setQuestionNo(next);
    setFollowUp(1);
    if (next <= MOCK_TOTAL) aiSay(interviewQuestions[(next - 1) % interviewQuestions.length], 900);
  }

  function send(text: string) {
    setMessages((m) => [...m, message("user", text)]);
    if (followUp < 2) {
      aiSay(aiFollowUps[followUp]);
      setFollowUp((f) => f + 1);
    } else {
      nextQuestion();
    }
  }

  return {
    ready: true,
    fatalError: null,
    tags: ["Middle+", "Designer"],
    total: MOCK_TOTAL,
    current: Math.min(questionNo, MOCK_TOTAL),
    questionText: finished ? null : interviewQuestions[(questionNo - 1) % interviewQuestions.length],
    finished,
    messages,
    typing,
    busy: typing,
    error: null,
    canRetry: false,
    send,
    retry: () => {},
    skip: nextQuestion,
  };
}

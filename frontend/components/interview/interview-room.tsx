"use client";

import { ChevronsRight, Lightbulb, RotateCw, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/chip";
import { PageHeader } from "@/components/ui/page-header";
import { hasBackend } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/types";
import { Composer } from "./composer";
import { useLiveInterview, useMockInterview } from "./use-interview";

function Message({ message }: { message: ChatMessage }) {
  const ai = message.role === "ai";
  return (
    <div className={cn("flex items-start gap-3", ai ? "justify-start" : "justify-end")}>
      {ai && (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/60">
          <User className="size-4" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-[18px] px-4 py-3 md:max-w-[70%]",
          ai ? "rounded-tl-[6px] bg-surface" : "rounded-tr-[6px] bg-[#2d2b2a]",
        )}
      >
        <p className="text-sm leading-[1.4] font-medium whitespace-pre-line">{message.text}</p>
        <p className="mt-2 text-xs text-white/50">{ai ? "AI Интервьюер" : "Вы"}</p>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2 pl-12 text-xs text-white/45" aria-live="polite">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-white/60"
            style={{ animation: `typing-dot 1.2s ${i * 0.2}s infinite` }}
          />
        ))}
      </span>
      AI Интервьюер печатает…
    </div>
  );
}

export function InterviewRoom({ id }: { id?: string }) {
  // Источник данных выбирается при сборке и не меняется, поэтому условный хук здесь безопасен.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const view = hasBackend ? useLiveInterview(id) : useMockInterview();
  const listRef = useRef<HTMLDivElement>(null);
  const { messages, typing, finished, total, current: progress, questionText: question } = view;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  if (view.fatalError) {
    return (
      <>
        <PageHeader title="Пробное интервью" />
        <section className="panel flex flex-col items-start gap-5 p-6 md:p-7">
          <p className="text-lg font-semibold">{view.fatalError}</p>
          <ButtonLink href={view.fatalError.includes("войти") ? "/login" : "/interview/setup"}>
            {view.fatalError.includes("войти") ? "Войти" : "Настроить интервью"}
          </ButtonLink>
        </section>
      </>
    );
  }

  if (!view.ready) {
    return (
      <>
        <PageHeader title="Пробное интервью" />
        <p className="text-sm text-white/60">Загружаем интервью…</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Пробное интервью">
        <div className="flex items-end justify-between gap-4">
          <div className="flex gap-2">
            {view.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <div className="flex w-[120px] flex-col items-end gap-2">
            <span className="text-sm font-semibold">
              {progress}/{total} вопросов
            </span>
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
              />
            </span>
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-4 lg:sticky lg:top-12 lg:w-[380px] lg:shrink-0">
          <section className="rounded-[var(--radius-panel)] border border-[#ff7333]/20 bg-[linear-gradient(150deg,#80290d_0%,#2e120a_55%,#100b0a_100%)] p-6 md:p-7">
            {finished ? (
              <div className="flex flex-col gap-5">
                <p className="text-[22px] leading-[1.25] font-semibold">Интервью завершено</p>
                <p className="text-sm text-white/70">AI уже готовит разбор твоих ответов.</p>
                <ButtonLink href="/results">Посмотреть результаты</ButtonLink>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <p className="text-[13px] text-white/75">
                  Вопрос {progress} из {total}
                </p>
                <p className="text-[22px] leading-[1.25] font-semibold lg:text-2xl">{question}</p>
                <button
                  type="button"
                  onClick={view.skip}
                  disabled={view.busy}
                  className="inline-flex h-[39px] w-fit items-center gap-2 rounded-[10px] bg-white/[0.14] px-3 text-sm font-semibold transition-colors hover:bg-white/[0.2] disabled:opacity-50"
                >
                  Пропустить вопрос
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            )}
          </section>

          <section className="panel flex flex-col gap-3 rounded-[20px] p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="size-[18px] text-accent" />
              Подсказка
            </h2>
            <p className="text-sm leading-[1.4] text-white/70">
              Отвечай по структуре: контекст → твоя роль → действия → результат. Так интервьюеру проще оценить твой вклад.
            </p>
          </section>
        </div>

        <section className="panel flex h-[560px] flex-1 flex-col gap-4 p-4 md:p-6 lg:h-[620px]" aria-label="Чат с AI-интервьюером">
          <div ref={listRef} className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {typing && <Typing />}
          </div>
          {view.error && (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-accent-soft">
              {view.error}
              {view.canRetry && (
                <button
                  type="button"
                  onClick={view.retry}
                  className="inline-flex items-center gap-1.5 font-semibold text-white underline underline-offset-4"
                >
                  <RotateCw className="size-3.5" />
                  Отправить ещё раз
                </button>
              )}
            </div>
          )}
          <Composer onSend={view.send} disabled={view.busy || finished} placeholder="Напиши ваш ответ" />
        </section>
      </div>
    </>
  );
}

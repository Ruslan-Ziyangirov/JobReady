import type { Metadata } from "next";
import { AnswerForm } from "@/components/plan/answer-form";
import { StatusIcon } from "@/components/ui/check-list";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Проработка темы" };

export default async function TopicPage() {
  const topic = await api.getTopicPractice("personal");

  return (
    <>
      <PageHeader back={{ href: "/plan/day", label: "Структура ответов" }} title={topic.title} subtitle={topic.description} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-3">
          <section className="glow-corner rounded-[var(--radius-card)] bg-surface-2 p-4">
            <h2 className="mb-4 text-base font-semibold">Как ты ответил</h2>
            <p className="flex items-start gap-3 text-sm leading-[1.4]">
              <StatusIcon tone="danger" />
              {topic.yourAnswer}
            </p>
          </section>
          <section className="glow-corner rounded-[var(--radius-card)] bg-surface-2 p-4">
            <h2 className="mb-4 text-base font-semibold">Как можно сильнее</h2>
            <p className="flex items-start gap-3 text-sm leading-[1.4]">
              <StatusIcon tone="success" />
              {topic.strongerAnswer}
            </p>
          </section>
          <section className="glow-corner rounded-[var(--radius-card)] bg-surface-2 p-4">
            <h2 className="mb-4 text-base font-semibold">Ответь заново:</h2>
            <ul className="list-disc space-y-0.5 pl-5 text-sm leading-[1.4] marker:text-white">
              {topic.retryHints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        </div>

        <AnswerForm />
      </div>
    </>
  );
}

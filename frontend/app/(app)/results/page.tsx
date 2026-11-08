import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { QuestionAccordion } from "@/components/results/question-accordion";
import { Button, ButtonLink } from "@/components/ui/button";
import { CheckList } from "@/components/ui/check-list";
import { PageHeader } from "@/components/ui/page-header";
import { ScoreBar, ScoreCard } from "@/components/ui/score-bar";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Результаты интервью" };

export default async function ResultsPage() {
  const result = await api.getInterviewResult();

  return (
    <>
      <PageHeader
        title="Результаты интервью"
        subtitle="Вот как ты справился и что стоит улучшить перед реальным собеседованием"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Общая готовность */}
        <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-2 p-4 md:row-span-2 lg:row-span-1">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-accent/60 blur-[90px]"
          />
          <div className="relative flex flex-col gap-4">
            <Image src="/illustrations/gauge.png" alt="" width={48} height={48} />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Общая готовность</span>
                <span className="text-[11px] text-white/60">Среднее по рынку</span>
              </div>
              <ScoreBar value={result.overall} market={result.marketAverage} tone="orange" size="lg" />
            </div>
            <p className="text-sm leading-[1.35] text-white/70">{result.summary}</p>
          </div>
        </section>

        <CheckList title="Как можно сильнее" items={result.strengths} tone="success" />
        <CheckList title="Как ты ответил" items={result.weaknesses} tone="danger" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {result.metrics.map((m) => (
          <ScoreCard key={m.id} label={m.label} value={m.value} market={m.market} tone={m.tone} />
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-[22px] font-semibold lg:text-2xl">Разбор вопросов</h2>
        <QuestionAccordion items={result.questions} />
      </section>

      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <Button variant="secondary" className="md:w-[220px]">
          <Download className="size-4" />
          Скачать отчёт
        </Button>
        <ButtonLink href="/plan" className="md:w-[280px]">
          Посмотреть RoadMap
        </ButtonLink>
      </div>
    </>
  );
}

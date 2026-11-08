import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "@/components/ui/chip";
import { IllustratedCard } from "@/components/ui/illustrated-card";
import { PageHeader } from "@/components/ui/page-header";
import { problems } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Структура ответов" };

const steps = [
  ["Выбери проблему", "Начни с той, что мешает сильнее всего"],
  ["Посмотри сильный ответ", "AI покажет, как ответить лучше на твоём примере"],
  ["Ответь заново", "Получи новую оценку и сравни с прошлой попыткой"],
];

export default function PlanDayPage() {
  return (
    <>
      <PageHeader
        back={{ href: "/plan", label: "План подготовки" }}
        title="Структура ответов"
        subtitle="На интервью твои ответы часто были неструктурированными. Выбери проблему, чтобы разобрать её с AI"
      >
        <Tag className="w-fit">День 1/3</Tag>
      </PageHeader>

      <div className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
        {problems.map((p) => (
          <Link
            key={p.id}
            href="/plan/topic"
            className="rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <IllustratedCard
              title={p.title}
              illustration={p.illustration}
              badge={p.done ? "Проработано" : "Не проработано"}
              className="min-h-[220px] lg:min-h-[250px]"
            />
          </Link>
        ))}
      </div>

      <section className="panel flex flex-col gap-5 p-6 md:p-7">
        <h2 className="text-lg font-semibold">Как проходит тренировка</h2>
        <ol className="grid gap-4 lg:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="flex gap-3.5 rounded-2xl bg-surface p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent/15 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold">{title}</span>
                <span className="text-[13px] leading-[1.35] text-white/60">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

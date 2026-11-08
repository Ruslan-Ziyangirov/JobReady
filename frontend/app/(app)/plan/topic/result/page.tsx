import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { CheckList } from "@/components/ui/check-list";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Ответ стал сильнее" };

function CompareBar({ label, value, gradient }: { label: string; value: number; gradient: string }) {
  return (
    <div className="h-[68px] overflow-hidden rounded-[15px] bg-white/[0.03]">
      <div
        className="relative flex h-full items-start justify-between rounded-[15px] px-3 pt-2.5"
        style={{ width: `${value * 10}%`, background: gradient }}
      >
        <span className="text-sm font-medium">{label}</span>
        <span className="flex items-start gap-1">
          <span className="text-[52px] leading-[0.95] font-medium">{value}</span>
          <span className="pt-0.5 text-sm text-white/60">/ 10</span>
        </span>
      </div>
    </div>
  );
}

export default async function TopicResultPage() {
  const r = await api.getPracticeResult("personal");

  return (
    <>
      <PageHeader
        back={{ href: "/plan/day", label: "Структура ответов" }}
        title="Ответ стал сильнее"
        subtitle="Сравни новую попытку с прошлой и переходи к следующей проблеме"
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-6 lg:sticky lg:top-12 lg:w-[360px] lg:shrink-0">
          <section className="flex flex-col gap-[5px] rounded-[var(--radius-card)] bg-[#161516] p-[5px]" aria-label="Сравнение оценок">
            <CompareBar label="Стало:" value={r.after} gradient="linear-gradient(90deg,#376f40,#222622)" />
            <CompareBar label="Было:" value={r.before} gradient="linear-gradient(90deg,#ac6d5a,#332f30)" />
          </section>
          <div className="flex flex-col gap-[5px] max-lg:hidden">
            <ButtonLink href="/plan/day">Перейти к следующей проблеме</ButtonLink>
            <ButtonLink href="/plan/topic" variant="secondary">
              Попробовать еще раз
            </ButtonLink>
          </div>
        </div>

        <section className="flex flex-1 flex-col gap-4">
          <h2 className="text-lg font-semibold">Что получилось улучшить</h2>
          <div className="flex flex-col gap-[5px]">
            <CheckList title="В прошлый раз:" items={r.previouslyGood} tone="success" />
            <CheckList title="С новой попытки:" items={r.improved} tone="success" />
            <CheckList title="Не улучшил:" items={r.notImproved} tone="danger" />
          </div>
        </section>

        <div className="flex flex-col gap-[5px] md:flex-row md:gap-3 lg:hidden">
          <ButtonLink href="/plan/day" className="md:flex-1">
            Перейти к следующей проблеме
          </ButtonLink>
          <ButtonLink href="/plan/topic" variant="secondary" className="md:flex-1">
            Попробовать еще раз
          </ButtonLink>
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ScoreBar } from "@/components/ui/score-bar";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { TopicStatus } from "@/lib/types";

export const metadata: Metadata = { title: "План подготовки" };

const statusLabel: Record<TopicStatus, string> = {
  "in-progress": "В процессе",
  soon: "Скоро",
  done: "Готово",
};

export default async function PlanPage() {
  const plan = await api.getPlan();
  const attention = plan.topics.filter((t) => t.status !== "done").length;

  return (
    <>
      <PageHeader
        title="Твой план подготовки"
        subtitle="Мы составили план на основе ошибок и слабых мест, найденных во время интервью"
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-card)] bg-surface-2 p-4">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -bottom-20 h-48 w-72 rounded-full bg-accent/70 blur-[70px]"
              />
              <Image src="/illustrations/mic-3d.png" alt="" width={65} height={65} className="relative" />
              <div className="relative flex flex-col gap-2">
                <p className="text-2xl font-bold">{plan.daysLeft} дня</p>
                <p className="text-sm text-white/80">До повторного интервью</p>
              </div>
            </section>
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Прошлая попытка</span>
                <span className="text-[11px] text-white/60">Среднее по рынку</span>
              </div>
              <ScoreBar value={plan.previousScore} market={plan.marketAverage} />
            </section>
          </div>

          <section className="flex flex-col gap-6">
            <h2 className="text-base font-semibold">{attention} темы требуют внимания</h2>
            <ol className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 md:mx-0 md:px-0">
              {plan.days.map((d, i) => (
                <li key={d.id} className="w-[184px] shrink-0 md:w-auto md:flex-1">
                  <div className="mb-4 flex items-center">
                    <span
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-full",
                        i === 0 ? "bg-accent ring-4 ring-accent/25" : "bg-[#6a3424]",
                      )}
                    >
                      {i === 0 && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="h-px flex-1 bg-[#6a3424]" />
                  </div>
                  <Link
                    href={i === 0 ? "/plan/day" : "#"}
                    aria-disabled={i !== 0}
                    className={cn(
                      "glow-top flex min-h-[111px] flex-col gap-3 rounded-[18px] border bg-surface-2 p-3.5 transition-colors",
                      i === 0 ? "border-accent/80 hover:bg-[#1c1a1a]" : "pointer-events-none border-transparent opacity-80",
                    )}
                  >
                    <span className="text-[11px] text-white/60">День {d.day}</span>
                    <span className="text-sm leading-[1.25] font-semibold">{d.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-3 md:flex-row">
            <ButtonLink href="/plan/day" className="md:w-[260px]">
              Начать подготовку
            </ButtonLink>
            <ButtonLink href="/interview/setup" variant="secondary" className="md:w-[260px]">
              Пройти интервью еще раз
            </ButtonLink>
          </div>
        </div>

        <aside className="panel flex flex-col gap-4 p-6 md:p-7 lg:w-[340px]">
          <h2 className="text-lg font-semibold">Темы плана</h2>
          <ul className="flex flex-col gap-2.5">
            {plan.topics.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-[14px] bg-surface p-3.5">
                <span
                  className={cn("size-2 shrink-0 rounded-full", t.status === "in-progress" ? "bg-accent" : "bg-white/25")}
                />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-semibold">{t.title}</span>
                  <span className="text-xs text-white/50">День {t.day}</span>
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    t.status === "in-progress" ? "text-accent" : "text-white/50",
                  )}
                >
                  {statusLabel[t.status]}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}

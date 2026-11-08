import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { history } from "@/lib/mock-data";

export const metadata: Metadata = { title: "История" };

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="История" subtitle="Все пройденные интервью и тренировки" />
      <ul className="flex flex-col gap-2.5">
        {history.map((h) => (
          <li key={h.id}>
            <Link
              href="/results"
              className="glow-corner flex items-center gap-4 rounded-[var(--radius-card)] bg-surface-2 p-4 transition-colors hover:bg-[#1c1a1a]"
            >
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-xs text-white/50">{h.date}</span>
                <span className="text-[15px] font-semibold">{h.title}</span>
              </span>
              <span className="text-xl font-semibold">
                {h.score}
                <span className="text-sm text-white/50">/10</span>
              </span>
              <ChevronRight className="size-5 text-white/40" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

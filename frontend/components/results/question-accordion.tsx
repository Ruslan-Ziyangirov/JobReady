"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { QuestionReview } from "@/lib/types";

function scoreColor(score: number) {
  if (score >= 9) return "bg-success";
  if (score >= 7) return "bg-[#ff7a1a]";
  return "bg-accent";
}

export function QuestionAccordion({ items }: { items: QuestionReview[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-[5px]">
      {items.map((q) => {
        const isOpen = open === q.id;
        return (
          <div key={q.id} className="rounded-[var(--radius-card)] bg-surface-2">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : q.id)}
              className="flex w-full items-end gap-4 p-4 text-left"
            >
              <span className="flex flex-1 flex-col gap-2">
                <span className="text-[11px] text-white/60">Вопрос {q.index}</span>
                <span className="text-[15px] leading-[1.25] font-semibold">{q.question}</span>
              </span>
              <span className="flex flex-col items-end gap-4 self-stretch">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", scoreColor(q.score))}>
                  {q.score}/10
                </span>
                <ChevronDown className={cn("mt-auto size-5 text-white/70 transition-transform", isOpen && "rotate-180")} />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-4 px-4 pb-5 text-sm leading-[1.45]">
                  <div>
                    <p className="mb-1 font-semibold">Что не сработало?</p>
                    <p className="text-white/70">{q.whatWentWrong}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold">Как сделать ответ сильнее?</p>
                    <p className="text-white/70">{q.howToImprove}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { IllustratedCard } from "@/components/ui/illustrated-card";
import { goals } from "@/lib/mock-data";
import type { GoalId } from "@/lib/types";

export function GoalPicker() {
  const [goal, setGoal] = useState<GoalId>("first-interview");

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4" role="radiogroup" aria-label="Цель">
        {goals.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={goal === g.id}
            onClick={() => setGoal(g.id)}
            className="rounded-[var(--radius-card)] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <IllustratedCard title={g.title} illustration={g.illustration} active={goal === g.id} />
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <ButtonLink href={`/interview/setup?goal=${goal}`} className="w-full md:w-[280px]">
          Далее
        </ButtonLink>
        <p className="hidden text-sm text-white/50 lg:block">Цель можно поменять в любой момент в настройках профиля</p>
      </div>
    </>
  );
}

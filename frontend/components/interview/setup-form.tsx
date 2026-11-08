"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ApiError, hasBackend, interviews } from "@/lib/api";
import { grades, interviewTypes, professions } from "@/lib/mock-data";
import type { GoalId, Option } from "@/lib/types";

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-4 text-sm font-medium text-white/70">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.id} active={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

const labelOf = (options: Option[], id: string) => options.find((o) => o.id === id)?.label ?? "";

export function SetupForm({ goal }: { goal?: GoalId }) {
  const router = useRouter();
  const [profession, setProfession] = useState("product-designer");
  const [grade, setGrade] = useState("middle");
  const [type, setType] = useState("tech");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; needsLogin: boolean } | null>(null);

  const query = new URLSearchParams({ profession, grade, type }).toString();

  async function start() {
    setPending(true);
    setError(null);
    try {
      const interview = await interviews.create({ profession, grade, type, goal });
      router.push(`/interview?id=${interview.id}`);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setError({
        message:
          status === 401
            ? "Чтобы начать интервью, нужно войти"
            : e instanceof ApiError
              ? e.message
              : "Что-то пошло не так. Попробуйте ещё раз",
        needsLogin: status === 401,
      });
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <section className="panel flex flex-1 flex-col gap-9 p-6 md:p-7">
        <ChipGroup label="Выбери профессию:" options={professions} value={profession} onChange={setProfession} />
        <ChipGroup label="Выбери грейд:" options={grades} value={grade} onChange={setGrade} />
        <ChipGroup label="Выбери тип собеседования:" options={interviewTypes} value={type} onChange={setType} />
      </section>

      <aside className="panel flex flex-col gap-5 p-6 md:p-7 lg:sticky lg:top-12 lg:w-[340px]">
        <h2 className="text-lg font-semibold">Твоё интервью</h2>
        <dl className="flex flex-col">
          {[
            ["Профессия", labelOf(professions, profession)],
            ["Грейд", labelOf(grades, grade)],
            ["Тип", labelOf(interviewTypes, type)],
            ["Вопросов", "10"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-white/[0.08] py-3.5 text-sm">
              <dt className="text-white/60">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-2 text-sm text-white/70">
          <Clock className="size-4" />
          Продлится 15–20 минут
        </p>
        {error && (
          <p role="alert" className="text-sm text-accent-soft">
            {error.message}
            {error.needsLogin && (
              <>
                {" "}
                <Link href="/login" className="underline underline-offset-4">
                  Войти
                </Link>
              </>
            )}
          </p>
        )}
        {hasBackend ? (
          <Button type="button" onClick={start} disabled={pending}>
            {pending ? "Готовим вопросы…" : "Начать интервью"}
          </Button>
        ) : (
          <ButtonLink href={`/interview?${query}`}>Начать интервью</ButtonLink>
        )}
      </aside>
    </div>
  );
}

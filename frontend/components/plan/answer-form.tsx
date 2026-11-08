"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function AnswerForm() {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <form
      className="panel flex flex-col gap-4 p-6 md:p-7 lg:sticky lg:top-12 lg:w-[420px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!answer.trim()) return;
        setSending(true);
        // TODO: POST /plan/topics/{id}/answers — оценка ответа в FastAPI
        setTimeout(() => router.push("/plan/topic/result"), 700);
      }}
    >
      <h2 className="text-lg font-semibold">Твой новый ответ</h2>
      <p className="text-sm leading-[1.4] text-white/60">
        Опиши ту же ситуацию, но от первого лица: что делал именно ты и к какому результату это привело.
      </p>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Например: «Я отвечал за редизайн онбординга…»"
        aria-label="Новый ответ"
      />
      <div className="flex gap-3">
        <button
          type="button"
          aria-label="Ответить голосом"
          className="grid size-[50px] shrink-0 place-items-center rounded-[14px] bg-surface text-white/85 transition-colors hover:bg-[#221f1c]"
        >
          <Mic className="size-5" />
        </button>
        <Button type="submit" className="flex-1" disabled={!answer.trim() || sending}>
          {sending ? "Оцениваем…" : "Отправить ответ"}
        </Button>
      </div>
    </form>
  );
}

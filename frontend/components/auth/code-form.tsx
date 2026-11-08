"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, auth } from "@/lib/api";
import { cn } from "@/lib/cn";

const LENGTH = 4;
const RESEND_SECONDS = 60;

export function CodeForm({ phone, initialWait = RESEND_SECONDS }: { phone: string; initialWait?: number }) {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(LENGTH).fill(""));
  const [seconds, setSeconds] = useState(initialWait);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const complete = code.every(Boolean);

  async function verify(value: string) {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await auth.verify(phone, value);
      router.push("/onboarding");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Что-то пошло не так. Попробуйте ещё раз");
      if (e instanceof ApiError && e.attemptsLeft) setNotice(`Осталось попыток: ${e.attemptsLeft}`);
      setCode(Array(LENGTH).fill(""));
      refs.current[0]?.focus();
      setPending(false);
    }
  }

  async function resend() {
    setError(null);
    setNotice(null);
    try {
      const { retryAfter } = await auth.resendCode(phone);
      setSeconds(retryAfter);
      setNotice("Новый код отправлен");
      setCode(Array(LENGTH).fill(""));
      refs.current[0]?.focus();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось отправить код. Попробуйте ещё раз");
      if (e instanceof ApiError && e.retryAfter) setSeconds(e.retryAfter);
    }
  }

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function setDigit(i: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setCode((c) => c.map((d, idx) => (idx === i ? "" : d)));
      return;
    }
    // Поддержка вставки всего кода сразу
    setCode((c) => {
      const next = [...c];
      digits
        .slice(0, LENGTH - i)
        .split("")
        .forEach((d, k) => (next[i + k] = d));
      return next;
    });
    refs.current[Math.min(i + digits.length, LENGTH - 1)]?.focus();
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (complete && !pending) verify(code.join(""));
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex justify-center gap-3">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={digit}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digit && i > 0) refs.current[i - 1]?.focus();
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={LENGTH}
              autoFocus={i === 0}
              aria-label={`Цифра ${i + 1}`}
              className={cn(
                "size-[64px] rounded-[16px] border bg-[#2a1d18] text-center text-2xl font-semibold outline-none transition-colors md:size-[72px]",
                digit ? "border-white/30" : "border-transparent",
                "focus:border-accent",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={seconds > 0}
          onClick={resend}
          className="text-sm text-white/70 underline underline-offset-4 disabled:no-underline disabled:opacity-60"
        >
          {seconds > 0 ? `Выслать код заново через ${seconds} с` : "Выслать код заново"}
        </button>
        {(error || notice) && (
          <div role="alert" className="text-center text-sm">
            {error && <p className="text-accent-soft">{error}</p>}
            {notice && <p className="text-white/70">{notice}</p>}
          </div>
        )}
      </div>
      <Button type="submit" disabled={!complete || pending}>
        {pending ? "Проверяем…" : "Далее"}
      </Button>
    </form>
  );
}

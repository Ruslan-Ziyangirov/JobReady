"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, auth } from "@/lib/api";

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^8/, "7").slice(0, 11);
  const d = digits.startsWith("7") ? digits.slice(1) : digits;
  let out = "+7";
  if (d.length) out += " (" + d.slice(0, 3);
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneDigits = phone.replace(/\D/g, "");
  const valid = name.trim().length > 1 && phoneDigits.length === 11;

  async function submit() {
    setPending(true);
    setError(null);
    const codePage = `/login/code?phone=${encodeURIComponent(phone)}`;
    try {
      await auth.requestCode(name.trim(), phone);
      router.push(codePage);
    } catch (e) {
      // Код уже отправлен меньше минуты назад — он ещё действует, просто идём его вводить.
      if (e instanceof ApiError && e.status === 429 && e.retryAfter && e.retryAfter <= 60) {
        router.push(`${codePage}&wait=${e.retryAfter}`);
        return;
      }
      setError(e instanceof ApiError ? e.message : "Что-то пошло не так. Попробуйте ещё раз");
      setPending(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !pending) submit();
      }}
    >
      <div className="flex flex-col gap-2.5">
        <Input placeholder="Имя" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Номер телефона"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value ? formatPhone(e.target.value) : "")}
        />
      </div>
      {error && (
        <p role="alert" className="-mt-2 text-sm text-accent-soft">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid || pending}>
        {pending ? "Отправляем код…" : "Войти"}
      </Button>
    </form>
  );
}

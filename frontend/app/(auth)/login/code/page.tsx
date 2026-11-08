import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { CodeForm } from "@/components/auth/code-form";
import { SmsArt } from "@/components/auth/sms-art";

export const metadata: Metadata = { title: "Код из SMS" };

export default async function CodePage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; wait?: string }>;
}) {
  const { phone, wait } = await searchParams;
  if (!phone) redirect("/login");
  const initialWait = Math.min(Math.max(Number(wait) || 60, 0), 60);

  return (
    <AuthShell illustration={<SmsArt />}>
      <Link
        href="/login"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
      >
        <ChevronLeft className="size-4" />
        Изменить номер
      </Link>
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight lg:text-[36px]">Введи код из SMS</h1>
        <p className="text-sm text-white/70">
          Мы выслали его на номер <span className="whitespace-nowrap text-white">{phone}</span>
        </p>
      </div>
      <CodeForm phone={phone} initialWait={initialWait} />
    </AuthShell>
  );
}

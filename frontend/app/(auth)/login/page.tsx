import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <AuthShell illustration={{ src: "/illustrations/offer.png", width: 480, height: 480 }}>
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight lg:text-[36px]">
          Рады видеть тебя
          <br />в JobReady!
        </h1>
        <p className="text-sm leading-[1.4] text-white/70">
          Создай аккаунт или войди, чтобы пройти интервью, сохранять результаты, историю тренировок и прогресс подготовки
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-xs leading-[1.4] text-white/45">
        Нажимая «Войти», ты соглашаешься с условиями сервиса и политикой обработки данных
      </p>
    </AuthShell>
  );
}

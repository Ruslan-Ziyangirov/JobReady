"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { plan, user } from "@/lib/mock-data";
import { isActive, navItems } from "./nav";

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Основная навигация">
      {navItems.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition-colors",
              active ? "bg-accent/15 text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <Icon className={cn("size-5", active ? "text-accent" : "text-white/60")} strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PrepProgress() {
  const totalDays = plan.days.length;
  const currentDay = totalDays - plan.daysLeft + 1;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <p className="text-sm font-semibold">До интервью — {plan.daysLeft} дня</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(currentDay / totalDays) * 100}%` }} />
      </div>
      <p className="text-xs text-white/60">
        День {currentDay} из {totalDays}
      </p>
    </div>
  );
}

function UserRow() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/25 text-sm font-semibold">
        {user.name[0]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-white/60">{user.role}</p>
      </div>
      <Link href="/login" aria-label="Выйти" className="rounded-lg p-1.5 text-white/50 transition-colors hover:text-white">
        <LogOut className="size-[18px]" />
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Блокируем прокрутку страницы под открытым меню
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="relative flex min-h-dvh overflow-x-clip">
      {/* Тёплый засвет на фоне */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[420px] left-1/2 h-[700px] w-[900px] -translate-x-1/3 rounded-full bg-white/[0.07] blur-[140px]"
      />

      {/* Сайдбар — от 1024px */}
      <aside className="sticky top-0 z-20 hidden h-dvh w-[260px] shrink-0 flex-col gap-9 border-r border-white/[0.06] bg-card px-5 py-7 lg:flex">
        <Logo className="px-2" />
        <NavList pathname={pathname} />
        <div className="mt-auto flex flex-col gap-6">
          <PrepProgress />
          <UserRow />
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Шапка — до 1024px */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-card/80 px-5 py-3 backdrop-blur-md md:px-8 md:py-4 lg:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Уведомления" className="rounded-xl bg-surface p-2.5 text-white/85">
              <Bell className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="rounded-xl bg-surface p-2.5 text-white/85"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </header>

        <main className="relative mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-7 px-5 pt-6 pb-12 md:px-10 md:pt-8 lg:gap-8 lg:px-14 lg:pt-12 lg:pb-16">
          {children}
        </main>
      </div>

      {/* Выезжающее меню — мобильный и планшет */}
      <div
        className={cn("fixed inset-0 z-40 lg:hidden", menuOpen ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={cn("absolute inset-0 bg-black/60 transition-opacity duration-200", menuOpen ? "opacity-100" : "opacity-0")}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[300px] max-w-[85vw] flex-col gap-8 bg-card px-5 py-5 transition-transform duration-200 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-surface p-2.5"
            >
              <X className="size-5" />
            </button>
          </div>
          <NavList pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          <div className="mt-auto flex flex-col gap-6">
            <PrepProgress />
            <UserRow />
          </div>
        </div>
      </div>
    </div>
  );
}

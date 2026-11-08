import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  children?: React.ReactNode;
};

export function PageHeader({ title, subtitle, back, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      {back && (
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <ChevronLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <h1 className="text-[28px] leading-[1.1] font-bold tracking-tight md:text-[30px] lg:text-[36px]">{title}</h1>
      {children}
      {subtitle && <p className="max-w-[600px] text-[15px] leading-[1.35] text-white/70 lg:text-base">{subtitle}</p>}
    </header>
  );
}

import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ href = "/onboarding", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="JobReady — на главную">
      <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-b from-[#ff8c4d] to-accent text-lg font-bold">
        J
      </span>
      <span className="text-xl font-bold tracking-tight">JobReady</span>
    </Link>
  );
}

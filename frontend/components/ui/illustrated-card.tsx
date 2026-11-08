import Image from "next/image";
import { cn } from "@/lib/cn";

type IllustratedCardProps = {
  title: string;
  illustration: string;
  active?: boolean;
  badge?: string;
  className?: string;
};

/** Карточка с 3D-иллюстрацией сверху и подписью снизу (Card action / Card action 2) */
export function IllustratedCard({ title, illustration, active, badge, className }: IllustratedCardProps) {
  return (
    <div
      className={cn(
        "glow-top flex h-full min-h-[208px] flex-col justify-end rounded-[var(--radius-card)] border bg-surface-2 p-4 transition-colors lg:min-h-[240px]",
        active ? "border-white/90" : "border-transparent hover:border-white/20",
        className,
      )}
    >
      {badge && (
        <span className="absolute top-4 left-4 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] text-white/70">
          {badge}
        </span>
      )}
      <Image
        src={illustration}
        alt=""
        width={165}
        height={132}
        className="pointer-events-none absolute top-1 left-1/2 h-[132px] w-auto -translate-x-1/2 lg:top-3 lg:h-[150px]"
      />
      <span className="relative text-[15px] leading-[1.25] font-semibold">{title}</span>
    </div>
  );
}

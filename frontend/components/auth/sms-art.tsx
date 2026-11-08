import { MessageSquareText } from "lucide-react";
import { cn } from "@/lib/cn";

function GlassPill({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-[104px] w-[216px] items-center justify-center gap-4 rounded-full border border-white/30",
        "bg-[linear-gradient(135deg,rgba(255,140,90,0.55),rgba(170,50,10,0.45))] backdrop-blur-md",
        "shadow-[0_30px_80px_rgba(60,10,0,0.55),inset_0_1px_0_rgba(255,255,255,0.35)]",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-[12px] bg-[#ffe6dc]">
        <MessageSquareText className="size-6 text-accent" strokeWidth={2.2} />
      </span>
      <span className="text-[22px] font-medium">{label}</span>
    </div>
  );
}

/** Иллюстрация «Code / SMS» из UI-кита, собранная в вёрстке — без растровых краёв */
export function SmsArt() {
  return (
    <div className="relative h-[260px] w-[320px] scale-[0.85] md:scale-100 lg:-translate-y-6 lg:scale-[1.25]" aria-hidden>
      <GlassPill label="Code" className="absolute top-6 left-0 rotate-[9deg]" />
      <GlassPill label="SMS" className="absolute top-[128px] left-[96px] -rotate-[6deg]" />
    </div>
  );
}

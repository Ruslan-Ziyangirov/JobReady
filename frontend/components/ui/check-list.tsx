import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type CheckListProps = {
  title: string;
  items: string[];
  tone: "success" | "danger";
  className?: string;
};

export function StatusIcon({ tone }: { tone: "success" | "danger" }) {
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full",
        tone === "success" ? "bg-success" : "bg-danger",
      )}
    >
      {tone === "success" ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
    </span>
  );
}

/** Карточка со списком (Card information 2 · Glow=Corner) */
export function CheckList({ title, items, tone, className }: CheckListProps) {
  return (
    <section className={cn("glow-corner rounded-[var(--radius-card)] bg-surface-2 p-4", className)}>
      <h3 className="mb-4 text-base font-semibold">{title}</h3>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm font-medium">
            <StatusIcon tone={tone} />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

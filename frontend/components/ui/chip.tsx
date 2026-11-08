import { cn } from "@/lib/cn";

type ChipProps = React.ComponentProps<"button"> & { active?: boolean };

export function Chip({ active, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-[33px] rounded-full px-3.5 text-[13px] font-semibold transition-[background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active
          ? "bg-accent text-white shadow-[0_0_14px_rgba(255,60,0,0.45),inset_0_0_8px_rgba(255,255,255,0.35)]"
          : "bg-surface text-white/90 hover:bg-[#221f1c]",
        className,
      )}
      {...props}
    />
  );
}

export function Tag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-[35px] items-center rounded-full border border-white/25 px-3 text-[13px] font-semibold",
        className,
      )}
      {...props}
    />
  );
}

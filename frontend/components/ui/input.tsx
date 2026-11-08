import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-[50px] w-full rounded-[14px] border border-transparent bg-surface px-4 text-[15px] font-medium text-white placeholder:text-white/40",
        "transition-colors outline-none focus:border-accent/70",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-[180px] w-full resize-y rounded-[14px] border border-transparent bg-surface p-4 text-[15px] leading-[1.45] font-medium text-white placeholder:text-white/40",
        "transition-colors outline-none focus:border-accent/70",
        className,
      )}
      {...props}
    />
  );
}

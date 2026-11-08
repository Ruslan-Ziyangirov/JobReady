import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex h-[50px] items-center justify-center gap-2 rounded-[14px] px-6 text-[15px] font-semibold transition-[background-color,box-shadow,transform,opacity] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_0_24px_rgba(255,60,0,0.45),inset_0_0_12px_rgba(255,255,255,0.35)] hover:bg-[#ff5220]",
  secondary: "bg-surface text-white hover:bg-[#221f1c]",
  ghost: "bg-white/[0.06] text-white hover:bg-white/[0.1]",
};

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

type ButtonProps = React.ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}

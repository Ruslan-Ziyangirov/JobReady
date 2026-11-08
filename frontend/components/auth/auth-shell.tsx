import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

type AuthShellProps = {
  /** Картинка из public/ или готовый React-узел */
  illustration: { src: string; width: number; height: number } | React.ReactNode;
  children: React.ReactNode;
};

function isImage(x: AuthShellProps["illustration"]): x is { src: string; width: number; height: number } {
  return typeof x === "object" && x !== null && "src" in x;
}

/**
 * Экран входа: на десктопе — оранжевая панель слева и форма справа,
 * на планшете и телефоне — панель сверху, форма под ней.
 */
export function AuthShell({ illustration, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row lg:p-6">
      <section
        className={cn(
          "relative flex h-[360px] shrink-0 items-center justify-center overflow-hidden rounded-b-[32px] md:h-[440px]",
          "lg:h-auto lg:w-[520px] lg:rounded-[32px]",
          "bg-[linear-gradient(180deg,#ff6b2b_0%,#802405_55%,#090604_92%)]",
        )}
      >
        <Logo href="/login" className="absolute top-6 left-6 md:top-7 md:left-8 lg:top-9 lg:left-10" />
        {isImage(illustration) ? (
          <Image
            src={illustration.src}
            alt=""
            width={illustration.width}
            height={illustration.height}
            priority
            className="h-auto w-[300px] md:w-[380px] lg:w-[460px] lg:-translate-y-6"
          />
        ) : (
          illustration
        )}
        <p className="absolute bottom-10 left-10 hidden max-w-[440px] text-[22px] leading-[1.25] font-semibold lg:block">
          Тренируй собеседования с AI-интервьюером и получай план подготовки под себя
        </p>
      </section>

      <section className="flex flex-1 items-start justify-center px-5 pt-10 pb-12 md:pt-14 lg:items-center lg:pt-0">
        <div className="flex w-full max-w-[400px] flex-col gap-6 md:max-w-[480px] lg:max-w-[400px]">{children}</div>
      </section>
    </div>
  );
}

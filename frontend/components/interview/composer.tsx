"use client";

import { Mic, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

type ComposerProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/** Поле ответа: микрофон, ввод, отправка (Message Composer) */
export function Composer({ onSend, disabled, placeholder = "Напиши свой ответ" }: ComposerProps) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0 && !disabled;

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <button
        type="button"
        aria-label="Ответить голосом"
        title="Голосовой ввод появится с бэкендом"
        className="grid size-[50px] shrink-0 place-items-center rounded-[14px] bg-white/90 text-black/70 transition-colors hover:bg-white"
      >
        <Mic className="size-5" />
      </button>
      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label="Ответ"
        className="field-sizing-content max-h-40 min-h-[50px] flex-1 resize-none rounded-[14px] bg-white/90 px-4 py-[14px] text-[15px] leading-[1.45] text-black placeholder:text-black/40 outline-none focus:bg-white"
      />
      <button
        type="submit"
        aria-label="Отправить"
        disabled={!canSend}
        className={cn(
          "grid size-[50px] shrink-0 place-items-center rounded-[14px] bg-accent text-white transition-[opacity,box-shadow]",
          "shadow-[0_0_20px_rgba(255,60,0,0.45),inset_0_0_10px_rgba(255,255,255,0.35)] disabled:opacity-50 disabled:shadow-none",
        )}
      >
        <SendHorizontal className="size-5" />
      </button>
    </form>
  );
}

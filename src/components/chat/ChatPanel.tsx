"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useChat } from "@livekit/components-react";
import { MessageSquare, Send, X } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { chatMessages, send, isSending } = useChat();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length, open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message) return;
    setError(null);
    try {
      await send(message);
      setText("");
    } catch {
      setError("Не удалось отправить сообщение. Проверьте соединение и повторите.");
    }
  }

  return (
    <aside
      className={cn(
        "flex-col bg-ink-900 md:rounded-2xl md:border md:border-ink-700",
        "fixed inset-0 z-30 md:static md:z-auto md:w-80 md:shrink-0",
        open ? "flex" : "hidden",
      )}
      aria-label="Чат"
    >
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <h2 className="font-semibold">Чат</h2>
        <button onClick={onClose} aria-label="Закрыть чат" className="rounded-lg p-1.5 hover:bg-ink-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4">
        {chatMessages.length === 0 && (
          <div className="grid h-full place-items-center text-center text-sm text-ink-400">
            <div>
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
              Сообщений пока нет.
              <br />
              Напишите первым!
            </div>
          </div>
        )}
        {chatMessages.map((m, i) => {
          const mine = !!m.from?.isLocal;
          return (
            <div key={m.id ?? i} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <span className="mb-0.5 text-xs text-ink-400">
                {mine ? "Вы" : (m.from?.name || m.from?.identity || "Участник")} · {formatTime(m.timestamp)}
              </span>
              <p
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                  mine ? "rounded-br-md bg-brand-500" : "rounded-bl-md bg-ink-700",
                )}
              >
                {m.message}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="mx-4 mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2 border-t border-ink-700 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Сообщение…"
          aria-label="Сообщение"
          className="min-w-0 flex-1 rounded-xl border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-base sm:text-sm outline-none placeholder:text-ink-400 focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          aria-label="Отправить"
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}

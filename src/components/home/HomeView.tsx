"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, MessageSquare, MonitorUp, Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createRoom } from "@/services/api";
import { parseRoomCode, saveHostKey } from "@/lib/utils";

const features = [
  { icon: Video, title: "HD-видео и звук", text: "Живая связь через LiveKit без установки программ." },
  { icon: MonitorUp, title: "Показ экрана", text: "Делитесь окном или всем экраном в один клик." },
  { icon: MessageSquare, title: "Чат в комнате", text: "Сообщения доходят всем участникам мгновенно." },
];

export function HomeView() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    setError(null);
    setCreating(true);
    try {
      const { room, hostKey } = await createRoom();
      saveHostKey(room.roomId, hostKey);
      router.push(`/room/${room.roomId}`);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    const id = parseRoomCode(code);
    if (!id) {
      setError("Введите ссылку или код вида abc-defg-hij");
      return;
    }
    setError(null);
    router.push(`/room/${id}`);
  }

  return (
    <main className="relative min-h-screen-dvh overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />
      <div className="relative mx-auto flex min-h-screen-dvh max-w-5xl flex-col px-4 sm:px-6">
        <header className="flex items-center gap-2 py-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent">
            <Video className="h-5 w-5 text-ink-950" />
          </span>
          <span className="text-lg font-bold tracking-tight">Meetly</span>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Видеозвонки <span className="bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">без лишнего</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink-200 sm:text-lg">
            Создайте комнату, отправьте ссылку — и общайтесь. Без регистрации и установки.
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <Button onClick={onCreate} disabled={creating} className="sm:py-3.5">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Создать комнату
            </Button>
            <form onSubmit={onJoin} className="flex flex-1 gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ссылка или код комнаты"
                aria-label="Ссылка или код комнаты"
                className="min-w-0 flex-1 rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-base sm:text-sm outline-none placeholder:text-ink-400 focus:border-brand-400"
              />
              <Button type="submit" variant="secondary" aria-label="Присоединиться" disabled={!code.trim()}>
                <ArrowRight className="h-4 w-4" />
                <span className="hidden sm:inline">Войти</span>
              </Button>
            </form>
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </section>

        <section className="grid gap-3 pb-12 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-ink-700 bg-ink-900/70 p-5">
              <Icon className="h-5 w-5 text-brand-400" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-ink-400">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

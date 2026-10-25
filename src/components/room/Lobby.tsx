"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, describeMediaError, initials, loadName, saveName } from "@/lib/utils";

interface Props {
  roomId: string;
  roomName: string | null;
  joining: boolean;
  error: string | null;
  onJoin: (name: string, cam: boolean, mic: boolean) => void;
}

export function Lobby({ roomId, roomName, joining, error, onJoin }: Props) {
  const [name, setName] = useState("");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setName(loadName());
    setLink(`${window.location.origin}/room/${roomId}`);
  }, [roomId]);

  // camera preview
  useEffect(() => {
    if (!camOn) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setMediaError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setMediaError(describeMediaError(e));
        setCamOn(false);
      });
    if (!navigator.mediaDevices) {
      setMediaError("Камера недоступна: откройте сайт по HTTPS или на localhost.");
      setCamOn(false);
    }
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [camOn]);

  // microphone check: live level meter
  useEffect(() => {
    if (!micOn) {
      setLevel(0);
      return;
    }
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(s).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setLevel(Math.min(1, avg / 60));
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch((e) => {
        if (cancelled) return;
        setMediaError(describeMediaError(e));
        setMicOn(false);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [micOn]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте ссылку:", link);
    }
  }

  const trimmed = name.trim();
  const submit = () => {
    saveName(trimmed);
    onJoin(trimmed, camOn, micOn);
  };

  return (
    <main className="mx-auto grid min-h-screen-dvh max-w-5xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("h-full w-full -scale-x-100 object-cover", !camOn && "hidden")}
          />
          {!camOn && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-24 w-24 place-items-center rounded-full bg-ink-600 text-3xl font-semibold">
                {initials(trimmed || "?")}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setMicOn((v) => !v)}
              aria-label={micOn ? "Выключить микрофон" : "Включить микрофон"}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full transition",
                micOn ? "bg-ink-700/90 hover:bg-ink-600" : "bg-red-500 hover:bg-red-600",
              )}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setCamOn((v) => !v)}
              aria-label={camOn ? "Выключить камеру" : "Включить камеру"}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full transition",
                camOn ? "bg-ink-700/90 hover:bg-ink-600" : "bg-red-500 hover:bg-red-600",
              )}
            >
              {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
          <Mic className="h-4 w-4 shrink-0" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full bg-accent transition-[width] duration-75" style={{ width: `${level * 100}%` }} />
          </div>
          <span className="w-28 text-right">{micOn ? "Скажите что-нибудь" : "Микрофон выключен"}</span>
        </div>
        {mediaError && (
          <p role="alert" className="mt-3 rounded-lg bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
            {mediaError} Вы можете войти и без камеры или микрофона.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-ink-700 bg-ink-900/70 p-6">
        <h1 className="text-2xl font-bold">{roomName ?? "Готовы присоединиться?"}</h1>
        <p className="mt-1 text-sm text-ink-400">
          Комната <span className="font-mono text-ink-200">{roomId}</span>
        </p>

        <label htmlFor="name" className="mt-6 block text-sm font-medium text-ink-200">
          Ваше имя
        </label>
        <input
          id="name"
          value={name}
          maxLength={40}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && trimmed && !joining && submit()}
          placeholder="Как вас представить?"
          className="mt-2 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-base sm:text-sm outline-none placeholder:text-ink-400 focus:border-brand-400"
        />

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button onClick={submit} disabled={!trimmed || joining} className="mt-5 w-full">
          {joining && <Loader2 className="h-4 w-4 animate-spin" />}
          {joining ? "Подключаемся…" : "Войти в комнату"}
        </Button>

        <div className="mt-6 border-t border-ink-700 pt-5">
          <p className="text-xs text-ink-400">Ссылка-приглашение</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-ink-800 p-2 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-200">{link}</span>
            <Button variant="secondary" onClick={copy} className="px-3 py-2 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

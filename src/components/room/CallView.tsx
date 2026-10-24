"use client";

import { useEffect, useState } from "react";
import type { DisconnectReason, RoomOptions } from "livekit-client";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useConnectionState,
  useParticipants,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Check, Copy, Loader2, Users, WifiOff, X } from "lucide-react";
import { VideoGrid } from "@/components/video/VideoGrid";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ControlBar } from "./ControlBar";
import type { TokenResponse } from "@/types";
import { describeMediaError } from "@/lib/utils";

const ROOM_OPTIONS: RoomOptions = { adaptiveStream: true, dynacast: true };

interface Props {
  roomId: string;
  roomName: string | null;
  session: TokenResponse;
  initialCam: boolean;
  initialMic: boolean;
  onLeave: () => void;
  onEnd: () => Promise<void>;
  onDisconnected: (reason?: DisconnectReason) => void;
}

export function CallView({ session, initialCam, initialMic, onDisconnected, ...rest }: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <LiveKitRoom
      serverUrl={session.serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={session.token}
      connect
      video={initialCam}
      audio={initialMic}
      options={ROOM_OPTIONS}
      onDisconnected={onDisconnected}
      onError={(e) => setNotice(e.message)}
      onMediaDeviceFailure={(_failure, kind) =>
        setNotice(
          kind === "videoinput" || kind === "audioinput"
            ? describeMediaError({ name: "NotAllowedError" })
            : "Не удалось получить доступ к устройству.",
        )
      }
      className="h-screen-dvh"
    >
      <Inner isHost={session.isHost} notice={notice} dismissNotice={() => setNotice(null)} setNotice={setNotice} {...rest} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function Inner({
  roomId,
  roomName,
  isHost,
  notice,
  dismissNotice,
  setNotice,
  onLeave,
  onEnd,
}: Pick<Props, "roomId" | "roomName" | "onLeave" | "onEnd"> & {
  isHost: boolean;
  notice: string | null;
  dismissNotice: () => void;
  setNotice: (m: string) => void;
}) {
  const state = useConnectionState();
  const count = useParticipants().length;
  const [chatOpen, setChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(dismissNotice, 7000);
    return () => clearTimeout(t);
  }, [notice, dismissNotice]);

  async function copyLink() {
    const link = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте ссылку:", link);
    }
  }

  return (
    <div className="flex h-screen-dvh flex-col bg-ink-950">
      <header className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{roomName ?? "Видеокомната"}</p>
          <p className="font-mono text-xs text-ink-400">{roomId}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5 text-xs text-ink-200" title="Участники">
            <Users className="h-3.5 w-3.5" /> {count}
          </span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1.5 text-xs text-ink-200 hover:bg-ink-700"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Скопировано" : "Пригласить"}</span>
          </button>
        </div>
      </header>

      {state === ConnectionState.Reconnecting && (
        <div role="status" className="mx-3 flex items-center gap-2 rounded-lg bg-amber-500/15 px-4 py-2 text-sm text-amber-300 sm:mx-5">
          <WifiOff className="h-4 w-4" /> Соединение потеряно, переподключаемся…
        </div>
      )}
      {notice && (
        <div role="alert" className="mx-3 mt-2 flex items-start gap-2 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300 sm:mx-5">
          <span className="flex-1">{notice}</span>
          <button onClick={dismissNotice} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-2 sm:px-5">
        <main className="relative min-w-0 flex-1">
          {state === ConnectionState.Connecting && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-ink-950/80">
              <div className="flex items-center gap-2 text-ink-200">
                <Loader2 className="h-5 w-5 animate-spin" /> Подключение к комнате…
              </div>
            </div>
          )}
          <VideoGrid />
          <div className="absolute left-1/2 top-3 -translate-x-1/2">
            <StartAudio
              label="Нажмите, чтобы включить звук"
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold shadow-lg"
            />
          </div>
        </main>
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>

      <ControlBar
        isHost={isHost}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((v) => !v)}
        onLeave={onLeave}
        onEnd={onEnd}
        onError={setNotice}
      />
    </div>
  );
}

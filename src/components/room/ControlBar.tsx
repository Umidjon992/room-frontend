"use client";

import { useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Mic, MicOff, MessageSquare, MonitorUp, MonitorX, PhoneOff, Video, VideoOff } from "lucide-react";
import { useChatUnread } from "@/hooks/useChatUnread";
import { cn, describeMediaError } from "@/lib/utils";

interface Props {
  isHost: boolean;
  chatOpen: boolean;
  onToggleChat: () => void;
  onLeave: () => void;
  onEnd: () => Promise<void>;
  onError: (message: string) => void;
}

function RoundButton({
  active = true,
  danger,
  label,
  onClick,
  children,
  badge,
  className,
}: {
  active?: boolean;
  danger?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center rounded-full transition sm:h-12 sm:w-12 focus-visible:outline-2 focus-visible:outline-brand-400",
        danger ? "bg-red-500 hover:bg-red-600" : active ? "bg-ink-700 hover:bg-ink-600" : "bg-red-500/90 hover:bg-red-500",
        className,
      )}
    >
      {children}
      {!!badge && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink-950">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export function ControlBar({ isHost, chatOpen, onToggleChat, onLeave, onEnd, onError }: Props) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const unread = useChatUnread(chatOpen);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const canShare = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;

  async function toggle(kind: "mic" | "cam" | "screen") {
    try {
      if (kind === "mic") await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      if (kind === "cam") await localParticipant.setCameraEnabled(!isCameraEnabled);
      if (kind === "screen") await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true });
    } catch (e) {
      // user closing the screen-share picker is not an error
      if ((e as { name?: string }).name === "NotAllowedError" && kind === "screen") return;
      onError(kind === "screen" ? "Не удалось начать демонстрацию экрана." : describeMediaError(e));
    }
  }

  async function end() {
    setEnding(true);
    try {
      await onEnd();
    } catch (e) {
      setEnding(false);
      setConfirmEnd(false);
      onError((e as Error).message);
    }
  }

  return (
    <footer className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-5">
      <div className="mx-auto flex w-fit max-w-full items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-ink-700 bg-ink-900/90 p-1.5 sm:gap-3 sm:p-2">
        <RoundButton active={isMicrophoneEnabled} label={isMicrophoneEnabled ? "Выключить микрофон" : "Включить микрофон"} onClick={() => toggle("mic")}>
          {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </RoundButton>
        <RoundButton active={isCameraEnabled} label={isCameraEnabled ? "Выключить камеру" : "Включить камеру"} onClick={() => toggle("cam")}>
          {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </RoundButton>
        {canShare && (
          <RoundButton
            active={!isScreenShareEnabled}
            label={isScreenShareEnabled ? "Остановить демонстрацию" : "Показать экран"}
            onClick={() => toggle("screen")}
            className={isScreenShareEnabled ? "!bg-brand-500 hover:!bg-brand-600" : ""}
          >
            {isScreenShareEnabled ? <MonitorX className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
          </RoundButton>
        )}
        <RoundButton active label={chatOpen ? "Скрыть чат" : "Открыть чат"} onClick={onToggleChat} badge={unread} className={chatOpen ? "!bg-brand-500" : ""}>
          <MessageSquare className="h-5 w-5" />
        </RoundButton>
        <div className="mx-1 h-6 w-px bg-ink-600" />
        <RoundButton danger label="Выйти из комнаты" onClick={onLeave}>
          <PhoneOff className="h-5 w-5" />
        </RoundButton>
        {isHost && (
          <button
            onClick={() => setConfirmEnd(true)}
            className="h-11 shrink-0 rounded-full border border-red-500/50 px-3 text-xs sm:h-12 sm:px-4 sm:text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            Завершить<span className="hidden sm:inline"> для всех</span>
          </button>
        )}
      </div>

      {confirmEnd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-ink-600 bg-ink-800 p-6">
            <h2 className="text-lg font-bold">Завершить звонок для всех?</h2>
            <p className="mt-2 text-sm text-ink-400">Все участники будут отключены, а вход в комнату по ссылке закроется.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmEnd(false)} disabled={ending} className="rounded-xl px-4 py-2.5 text-sm hover:bg-ink-700">
                Отмена
              </button>
              <button onClick={end} disabled={ending} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                {ending ? "Завершаем…" : "Завершить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

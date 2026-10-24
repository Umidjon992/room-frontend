"use client";

import Link from "next/link";
import { DisconnectReason } from "livekit-client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Lobby } from "./Lobby";
import { CallView } from "./CallView";
import { ApiError, endRoom, getRoom, getToken } from "@/services/api";
import { clearHostKey, loadHostKey } from "@/lib/utils";
import type { RoomInfo, TokenResponse } from "@/types";

type Phase =
  | { type: "loading" }
  | { type: "lobby" }
  | { type: "call"; session: TokenResponse; cam: boolean; mic: boolean }
  | { type: "left" }
  | { type: "ended" }
  | { type: "error"; message: string; retry?: boolean };

function Message({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-ink-400">{text}</p>
        <div className="mt-6 flex justify-center gap-3">{children}</div>
      </div>
    </main>
  );
}

const HomeLink = () => (
  <Link href="/" className="rounded-xl bg-ink-700 px-5 py-3 text-sm font-semibold hover:bg-ink-600">
    На главную
  </Link>
);

export function RoomClient({ roomId }: { roomId: string }) {
  const [phase, setPhase] = useState<Phase>({ type: "loading" });
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    getRoom(roomId)
      .then((r) => {
        if (cancelled) return;
        setRoom(r);
        setPhase(r.status === "ended" ? { type: "ended" } : { type: "lobby" });
      })
      .catch((e: ApiError) => {
        if (cancelled) return;
        setPhase({
          type: "error",
          message: e.status === 404 ? "Такой комнаты не существует. Проверьте ссылку." : e.message,
          retry: e.status !== 404,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const join = useCallback(
    async (displayName: string, cam: boolean, mic: boolean) => {
      setJoining(true);
      setJoinError(null);
      setName(displayName);
      try {
        const session = await getToken(roomId, displayName, loadHostKey(roomId));
        setPhase({ type: "call", session, cam, mic });
      } catch (e) {
        if (e instanceof ApiError && e.status === 410) setPhase({ type: "ended" });
        else setJoinError((e as Error).message);
      } finally {
        setJoining(false);
      }
    },
    [roomId],
  );

  const onDisconnected = useCallback((reason?: DisconnectReason) => {
    if (reason === DisconnectReason.ROOM_DELETED) setPhase({ type: "ended" });
    else if (reason === DisconnectReason.CLIENT_INITIATED) setPhase({ type: "left" });
    else if (reason === DisconnectReason.DUPLICATE_IDENTITY || reason === DisconnectReason.PARTICIPANT_REMOVED)
      setPhase({ type: "error", message: "Вы были отключены от комнаты." });
    else setPhase({ type: "error", message: "Соединение потеряно. Проверьте интернет и войдите снова.", retry: true });
  }, []);

  const onEnd = useCallback(async () => {
    const key = loadHostKey(roomId);
    if (key) await endRoom(roomId, key);
    clearHostKey(roomId);
    setPhase({ type: "ended" });
  }, [roomId]);

  switch (phase.type) {
    case "loading":
      return (
        <main className="grid min-h-screen place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" aria-label="Загрузка" />
        </main>
      );
    case "lobby":
      return <Lobby roomId={roomId} roomName={room?.name ?? null} joining={joining} error={joinError} onJoin={join} />;
    case "call":
      return (
        <CallView
          roomId={roomId}
          roomName={room?.name ?? null}
          session={phase.session}
          initialCam={phase.cam}
          initialMic={phase.mic}
          onLeave={() => setPhase({ type: "left" })}
          onEnd={onEnd}
          onDisconnected={onDisconnected}
        />
      );
    case "left":
      return (
        <Message title="Вы вышли из комнаты" text="Можно вернуться в любой момент, пока звонок не завершён.">
          <Button onClick={() => setPhase({ type: "lobby" })}>Вернуться</Button>
          <HomeLink />
        </Message>
      );
    case "ended":
      return (
        <Message title="Звонок завершён" text="Создатель завершил эту комнату. Войти в неё больше нельзя.">
          <HomeLink />
        </Message>
      );
    case "error":
      return (
        <Message title="Что-то пошло не так" text={phase.message}>
          {phase.retry && (
            <Button onClick={() => (name ? setPhase({ type: "lobby" }) : window.location.reload())}>Попробовать снова</Button>
          )}
          <HomeLink />
        </Message>
      );
  }
}

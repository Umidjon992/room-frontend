const ROOM_CODE = /[a-z]{3}-[a-z]{4}-[a-z]{3}/i;

/** Accepts a full invite link or a bare code and returns the normalized room id, or null. */
export function parseRoomCode(input: string): string | null {
  const match = input.trim().match(ROOM_CODE);
  return match ? match[0].toLowerCase() : null;
}

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

export const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

// Same room link is stored per browser so the creator keeps host rights after a reload.
const hostKeyStorage = (roomId: string) => `meetly:host:${roomId}`;
const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};
export const saveHostKey = (roomId: string, key: string) => safe(() => localStorage.setItem(hostKeyStorage(roomId), key), undefined);
export const loadHostKey = (roomId: string) => safe(() => localStorage.getItem(hostKeyStorage(roomId)) ?? undefined, undefined);
export const clearHostKey = (roomId: string) => safe(() => localStorage.removeItem(hostKeyStorage(roomId)), undefined);
export const loadName = () => safe(() => localStorage.getItem("meetly:name") ?? "", "");
export const saveName = (name: string) => safe(() => localStorage.setItem("meetly:name", name), undefined);

export function describeMediaError(err: unknown): string {
  const name = (err as { name?: string })?.name;
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Доступ к камере или микрофону запрещён. Разрешите его в настройках браузера (значок замка в адресной строке).";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Камера или микрофон не найдены. Подключите устройство и обновите страницу.";
    case "NotReadableError":
    case "AbortError":
      return "Устройство занято другим приложением. Закройте его и попробуйте снова.";
    default:
      return "Не удалось получить доступ к камере или микрофону.";
  }
}

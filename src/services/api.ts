import type { CreatedRoom, RoomInfo, TokenResponse } from "@/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Не удаётся связаться с сервером. Проверьте подключение к интернету.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(body?.error?.message ?? "Что-то пошло не так. Попробуйте ещё раз.", res.status);
  }
  return body.data as T;
}

export const createRoom = (name?: string) =>
  request<CreatedRoom>("/rooms", { method: "POST", body: JSON.stringify({ name: name || undefined }) });

export const getRoom = (roomId: string) => request<{ room: RoomInfo }>(`/rooms/${roomId}`).then((d) => d.room);

export const getToken = (roomId: string, name: string, hostKey?: string) =>
  request<TokenResponse>(`/rooms/${roomId}/token`, { method: "POST", body: JSON.stringify({ name, hostKey }) });

export const endRoom = (roomId: string, hostKey: string) =>
  request<{ room: RoomInfo }>(`/rooms/${roomId}`, { method: "DELETE", headers: { "x-host-key": hostKey } });

export interface RoomInfo {
  roomId: string;
  name: string | null;
  status: "active" | "ended";
  createdAt: string;
  endedAt: string | null;
}

export interface CreatedRoom {
  room: RoomInfo;
  hostKey: string;
  link: string;
}

export interface TokenResponse {
  token: string;
  serverUrl: string;
  isHost: boolean;
}

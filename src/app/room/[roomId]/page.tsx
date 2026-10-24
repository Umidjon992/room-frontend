import { RoomClient } from "@/components/room/RoomClient";

export default async function Page({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <RoomClient roomId={roomId.toLowerCase()} />;
}

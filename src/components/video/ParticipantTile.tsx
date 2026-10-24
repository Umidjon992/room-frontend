"use client";

import { Track } from "livekit-client";
import {
  VideoTrack,
  isTrackReference,
  useIsSpeaking,
  useTrackMutedIndicator,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { MicOff, MonitorUp } from "lucide-react";
import { cn, initials } from "@/lib/utils";

export function ParticipantTile({ trackRef, compact = false }: { trackRef: TrackReferenceOrPlaceholder; compact?: boolean }) {
  const { participant, source } = trackRef;
  const isScreen = source === Track.Source.ScreenShare;
  const speaking = useIsSpeaking(participant);
  const { isMuted: micMuted } = useTrackMutedIndicator({ participant, source: Track.Source.Microphone });
  const { isMuted: camMuted } = useTrackMutedIndicator({ participant, source: Track.Source.Camera });

  const showVideo = isTrackReference(trackRef) && (isScreen || !camMuted);
  const name = participant.name || participant.identity;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border-2 border-transparent bg-ink-800",
        speaking && !isScreen && "speaking",
      )}
    >
      {showVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn(
            "h-full w-full",
            isScreen ? "object-contain bg-black" : "object-cover",
            participant.isLocal && !isScreen && "-scale-x-100",
          )}
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <span
            className={cn(
              "grid place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-semibold",
              compact ? "h-10 w-10 text-sm" : "h-20 w-20 text-2xl",
            )}
          >
            {initials(name)}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs backdrop-blur">
        {isScreen ? (
          <MonitorUp className="h-3.5 w-3.5 shrink-0 text-accent" />
        ) : (
          micMuted && <MicOff className="h-3.5 w-3.5 shrink-0 text-red-400" aria-label="Микрофон выключен" />
        )}
        <span className="truncate">
          {isScreen ? `Экран: ${name}` : participant.isLocal ? `${name} (вы)` : name}
        </span>
      </div>
    </div>
  );
}

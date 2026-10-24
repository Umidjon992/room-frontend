"use client";

import { Track } from "livekit-client";
import { isTrackReference, useTracks, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";
import { cn } from "@/lib/utils";

const keyOf = (t: TrackReferenceOrPlaceholder) => `${t.participant.identity}:${t.source}`;

function gridCols(n: number) {
  if (n <= 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-1 sm:grid-cols-2";
  if (n <= 4) return "grid-cols-2";
  if (n <= 6) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

export function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const screens = tracks.filter((t) => t.source === Track.Source.ScreenShare && isTrackReference(t));
  const cameras = tracks.filter((t) => t.source === Track.Source.Camera);

  if (screens.length > 0) {
    return (
      <div className="flex h-full flex-col gap-3 lg:flex-row">
        <div className="min-h-0 flex-1">
          <ParticipantTile key={keyOf(screens[0])} trackRef={screens[0]} />
        </div>
        <div className="thin-scroll flex h-28 shrink-0 gap-3 overflow-x-auto lg:h-auto lg:w-56 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
          {cameras.map((t) => (
            <div key={keyOf(t)} className="aspect-video h-full shrink-0 lg:h-auto lg:w-full">
              <ParticipantTile trackRef={t} compact />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("thin-scroll grid h-full auto-rows-fr gap-3 overflow-y-auto", gridCols(cameras.length))}>
      {cameras.map((t) => (
        <div key={keyOf(t)} className="min-h-0">
          <ParticipantTile trackRef={t} />
        </div>
      ))}
    </div>
  );
}

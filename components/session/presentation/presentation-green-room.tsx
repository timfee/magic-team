"use client";

import type { MagicSessionWithDetails } from "@/lib/types/session";
import { AnimatedFacepile } from "@/components/ui/animated-facepile";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateJoinCode } from "@/lib/utils/session-utils";

interface ActiveUser {
  id: string;
  name: string | null;
  image: string | null;
  lastSeenAt: Date;
}

interface PresentationGreenRoomProps {
  session: MagicSessionWithDetails;
  userCount: number;
  activeUsers: ActiveUser[];
  startTime?: Date | null;
}

export function PresentationGreenRoom({
  session,
  userCount,
  activeUsers,
  startTime,
}: PresentationGreenRoomProps) {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(
    startTime ? "" : null,
  );

  // Calculate time until start
  useEffect(() => {
    if (!startTime) {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = start.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Starting now...");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Generate join URL
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/session/${session.id}`
      : "";
  const shortCode = generateJoinCode(session.id);

  return (
    <div className="flex h-full flex-col items-center justify-center text-white">
      {/* Session Title */}
      <div className="mb-12 text-center">
        <h1 className="text-7xl font-bold">{session.name}</h1>
        {session.description && (
          <p className="mt-4 text-3xl text-zinc-400">{session.description}</p>
        )}
      </div>

      {/* Timer (if set) */}
      {timeRemaining && (
        <div className="mb-12 text-center">
          <div className="text-2xl text-zinc-400">Starting in</div>
          <div className="mt-2 text-8xl font-bold text-blue-400">
            {timeRemaining}
          </div>
        </div>
      )}

      {/* Participant Count */}
      <div className="mb-12 text-center">
        <div className="text-9xl font-bold text-white">{userCount}</div>
        <div className="mt-4 text-3xl text-zinc-400">
          {userCount === 1 ? "participant" : "participants"} here
        </div>
      </div>

      {/* Participant Avatars */}
      {activeUsers.length > 0 && (
        <div className="mb-12 flex justify-center">
          <AnimatedFacepile users={activeUsers} maxVisible={12} size="lg" />
        </div>
      )}

      {/* Join Instructions */}
      <div className="mt-auto grid grid-cols-2 gap-12">
        {/* QR Code */}
        <div className="flex flex-col items-center rounded-2xl border-4 border-white/20 bg-white/10 p-8 backdrop-blur-lg">
          <div className="mb-4 text-2xl font-semibold">Scan to Join</div>
          <div className="rounded-xl bg-white p-6">
            <QRCodeSVG value={joinUrl} size={200} level="H" />
          </div>
        </div>

        {/* URL Code */}
        <div className="flex flex-col items-center justify-center rounded-2xl border-4 border-white/20 bg-white/10 p-8 backdrop-blur-lg">
          <div className="mb-4 text-2xl font-semibold">Or enter code</div>
          <div className="text-center">
            <div className="text-xl text-zinc-400">magicretro.app/join</div>
            <div className="mt-2 font-mono text-6xl font-bold tracking-wider text-blue-400">
              {shortCode}
            </div>
          </div>
        </div>
      </div>

      {/* Waiting message */}
      <div className="mt-8 text-center text-2xl text-zinc-500">
        Waiting for facilitator to begin...
      </div>
    </div>
  );
}

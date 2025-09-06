// src/Game.tsx
import { useRef } from "react";
import Ground from "./entities/Ground";
import Boundaries from "./entities/Boundaries";
import Player from "./entities/Player";
import Gun from "./entities/Gun";

export default function Game({ enabled, locked }: { enabled: boolean; locked: boolean }) {
  const playerPosRef = useRef<[number, number, number]>([0, 1, 0]);

  return (
    <>
      <Ground />
      <Boundaries />
      {/* ✅ Player only active when locked */}
      <Player posRef={playerPosRef} active={locked} />
      {/* ✅ Gun only listens/fires when both enabled AND locked */}
      <Gun playerPosRef={playerPosRef} enabled={enabled && locked} />
    </>
  );
}

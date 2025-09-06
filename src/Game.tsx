// src/Game.tsx
import { useRef } from "react";
import Ground from "./entities/Ground";
import Boundaries from "./entities/Boundaries";
import Player from "./entities/Player";
import Gun from "./entities/Gun";
import Spaceship from "./entities/Spaceship";
import Enemies from "./entities/Enemies";
import AmmoPickup from "./entities/AmmoPickup";
import { config } from "./config";

export default function Game({ enabled, locked }: { enabled: boolean; locked: boolean }) {
  const playerPosRef = useRef<[number, number, number]>([0, 1, 0]);

  return (
    <>
      <Ground />
      <Boundaries />

      {/* ✅ Spawning happens only when locked */}
      <Spaceship active={locked} />

      {/* ✅ Enemy AI movement only when locked */}
      <Enemies playerPosRef={playerPosRef as any} active={locked} />

      {/* Player + Gun already gated by locked/enabled */}
      <Player posRef={playerPosRef} active={locked} />
      <Gun playerPosRef={playerPosRef} enabled={enabled && locked} />
     {Array.from({ length: config.pickups.poolSize }).map((_, i) => (
  <AmmoPickup key={i} index={i} playerPosRef={playerPosRef as any} />
))}
    </>
  );
}

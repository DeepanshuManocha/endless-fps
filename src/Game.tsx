// src/Game.tsx
import { useRef } from "react";
import Ground from "./entities/Ground";
import Boundaries from "./entities/Boundaries";
import Player from "./entities/Player";
import Gun from "./entities/Gun";
import Spaceship from "./entities/Spaceship";
import Enemies from "./entities/Enemies";
import AmmoPickup from "./entities/AmmoPickup";
import EnemyBullets from "./entities/EnemyBullets";
import { useGameStore } from "./store/gameStore";
import { config } from "./config";

export default function Game({ enabled, locked }: { enabled: boolean; locked: boolean }) {
  const playerPosRef = useRef<[number, number, number]>([0, 1, 0]);
  const gameOver = useGameStore((s) => s.gameOver);
  const active = locked && !gameOver;      // gate AI & spawn
  const gunEnabled = enabled && locked && !gameOver;

  return (
    <>
      <Ground />
      <Boundaries />

      <Spaceship active={active} />
      <Enemies playerPosRef={playerPosRef as any} active={active} />
      <EnemyBullets playerPosRef={playerPosRef as any} />
      {Array.from({ length: config.pickups.poolSize }).map((_, i) => (
        <AmmoPickup key={i} index={i} playerPosRef={playerPosRef as any} />
      ))}

      <Player posRef={playerPosRef} active={active} />
      <Gun playerPosRef={playerPosRef} enabled={gunEnabled} />
    </>
  );
}

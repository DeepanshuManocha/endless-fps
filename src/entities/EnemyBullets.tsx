// src/entities/EnemyBullets.tsx
import { config } from "../config";
import EnemyBullet from "./EnemyBullet";
import type { MutableRefObject } from "react";
import type { Triplet } from "@react-three/cannon";

export default function EnemyBullets({
  playerPosRef,
}: {
  playerPosRef: MutableRefObject<Triplet>;
}) {
  const n = config.enemyBullets.poolSize;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <EnemyBullet key={i} index={i} playerPosRef={playerPosRef as any} />
      ))}
    </>
  );
}

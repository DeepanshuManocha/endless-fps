// src/entities/Enemies.tsx
import { useMemo } from "react";
import { Enemy } from "./Enemy";
import type { MutableRefObject } from "react";
import type { Triplet } from "@react-three/cannon";
import { config } from "../config";
import { useEnemyStore } from "../store/enemyStore";

export default function Enemies({
  playerPosRef,
  active = true,
}: {
  playerPosRef: MutableRefObject<Triplet>;
  active?: boolean;
}) {
  const n = config.enemies.poolSize;

  // ensure store hook runs once
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _register = useEnemyStore((s) => s.register);
  useMemo(() => {}, [_register]);

  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <Enemy key={i} index={i} playerPosRef={playerPosRef as any} aiEnabled={active} />
      ))}
    </>
  );
}

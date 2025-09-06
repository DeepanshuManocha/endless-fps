// src/entities/HealthPickups.tsx
import { config } from "../config";
import HealthPickup from "./HealthPickup";
import type { MutableRefObject } from "react";
import type { Triplet } from "@react-three/cannon";

export default function HealthPickups({
  playerPosRef,
}: {
  playerPosRef: MutableRefObject<Triplet>;
}) {
  const n = config.healthPickups.poolSize;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <HealthPickup key={i} index={i} playerPosRef={playerPosRef as any} />
      ))}
    </>
  );
}

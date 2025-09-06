import { useCylinder } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { config } from "../config";
import { useEnemyStore } from "../store/enemyStore";
import { Vector3 } from "three";

function randInDisc(radius: number, out: Vector3) {
  const r = Math.sqrt(Math.random()) * radius;
  const t = Math.random() * Math.PI * 2;
  out.set(Math.cos(t) * r, 0, Math.sin(t) * r);
  return out;
}

export default function Spaceship({ active = true }: { active?: boolean }) {
  const g = config.ground;
  const s = config.spaceship;

  const radius = Math.min(g.width, g.depth) * s.sizeRatio * 0.5;
  const [ref] = useCylinder(() => ({
    args: [radius, radius, s.thickness, 32],
    type: "Kinematic",
    position: [0, g.height + s.heightAboveGround, 0],
  }));

  const t = useRef(0);
  const tmp = useMemo(() => ({ dropPos: new Vector3() }), []);
  const isActiveRef = useRef(active);
  useEffect(() => { isActiveRef.current = active; if (!active) t.current = 0; }, [active]);

  const spawnAt = useEnemyStore((st) => st.spawnAt);
  const aliveCount = useEnemyStore((st) => st.aliveCount);

  // On-kill replacement — but respect maxSimultaneous
  useEffect(() => {
    if (!active) return;
    const off = useEnemyStore.getState().onKilled(() => {
      if (!isActiveRef.current) return;
      if (aliveCount() >= s.maxSimultaneous) return; // ✅ cap
      const y = g.height + s.heightAboveGround - s.thickness * 0.5 - 0.2;
      randInDisc(radius * 0.75, tmp.dropPos);
      spawnAt([tmp.dropPos.x, y, tmp.dropPos.z]);
    });
    return () => { if (typeof off === "function") off(); };
  }, [active, radius, g.height, s.heightAboveGround, s.thickness, s.maxSimultaneous, spawnAt, aliveCount, tmp.dropPos]);

  // Timed drop also respects cap
  useFrame((_, dt) => {
    if (!active) return;
    t.current += dt;
    if (t.current >= s.dropInterval) {
      t.current = 0;
      if (aliveCount() < s.maxSimultaneous) {
        const y = g.height + s.heightAboveGround - s.thickness * 0.5 - 0.2;
        randInDisc(radius * 0.75, tmp.dropPos);
        spawnAt([tmp.dropPos.x, y, tmp.dropPos.z]);
      }
    }
  });

  return (
    <mesh ref={ref} receiveShadow castShadow>
      <cylinderGeometry args={[radius, radius, s.thickness, 32]} />
      <meshStandardMaterial color={s.color} />
    </mesh>
  );
}

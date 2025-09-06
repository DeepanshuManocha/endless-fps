// src/entities/HealthPickup.tsx
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Mesh, Vector3 } from "three";
import { config } from "../config";
import { useHealthPickupStore, type HealthPickupHandle } from "../store/healthPickupStore";
import { useGameStore } from "../store/gameStore";

type V3 = [number, number, number];

export default function HealthPickup({
  index,
  playerPosRef,
}: {
  index: number;
  playerPosRef: MutableRefObject<V3>;
}) {
  const cfg = config.healthPickups;
  const half = cfg.size / 2;
  const [active, setActive] = useState(false);
  const ttlRef = useRef(0);

  const [ref, api] = useBox<Mesh>(() => ({
    args: [half, half, half],
    mass: 0.01,
    position: [0, -999, 0],
    type: "Dynamic",
    collisionFilterGroup: 0x0020, // health pickups
    collisionFilterMask: 0x0001,  // world only
    material: { restitution: 0.1, friction: 0.8 },
  }));

  const tmp = useMemo(() => ({ pos: new Vector3() }), []);

  const handle = useMemo<HealthPickupHandle>(() => ({
    index,
    activate: (pos) => {
      setActive(true);
      ttlRef.current = cfg.lifetime;
      const rx = (Math.random() * 2 - 1) * cfg.spawnSpread;
      const rz = (Math.random() * 2 - 1) * cfg.spawnSpread;
      api.position.set(pos[0], pos[1], pos[2]);
      api.velocity.set(rx, cfg.spawnImpulse + Math.random() * 0.5, rz);
      api.angularVelocity.set(Math.random(), Math.random(), Math.random());
    },
    deactivate: () => {
      setActive(false);
      ttlRef.current = 0;
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      api.position.set(0, -999, 0);
    },
    isActive: () => active,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [active, api, cfg.lifetime, cfg.spawnImpulse, cfg.spawnSpread]);

  const register = useHealthPickupStore((s) => s.register);
  const unregister = useHealthPickupStore((s) => s.unregister);
  useEffect(() => {
    register(index, handle);
    return () => unregister(index);
  }, [index, handle, register, unregister]);

  useFrame((_, dt) => {
    if (!active) return;

    // TTL
    ttlRef.current -= dt;
    if (ttlRef.current <= 0) {
      handle.deactivate();
      return;
    }

    // proximity collect (sphere vs point, like ammo pickups)
    ref.current!.getWorldPosition(tmp.pos);
    const p = playerPosRef.current;
    const dx = tmp.pos.x - p[0];
    const dz = tmp.pos.z - p[2];
    const r = cfg.collectRadius;
    if (dx * dx + dz * dz <= r * r) {
      useGameStore.getState().healPlayer(config.healthPickups.healPerPickup);
      handle.deactivate();
    }
  });

  return (
    <mesh ref={ref} castShadow visible={active}>
      <boxGeometry args={[cfg.size, cfg.size, cfg.size]} />
      <meshStandardMaterial color={cfg.color} />
    </mesh>
  );
}

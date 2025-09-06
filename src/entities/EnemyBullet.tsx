// src/entities/EnemyBullet.tsx
import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Mesh, Vector3 } from "three";
import { config } from "../config";
import { useEnemyBulletStore, type EnemyBulletHandle } from "../store/enemyBulletStore";
import { useGameStore } from "../store/gameStore";

type V3 = [number, number, number];

export default function EnemyBullet({
  index,
  playerPosRef,
}: {
  index: number;
  playerPosRef: MutableRefObject<V3>;
}) {
  const cfg = config.enemyBullets;
  const [active, setActive] = useState(false);
  const ttlRef = useRef(0);

  const [ref, api] = useSphere<Mesh>(() => ({
    args: [cfg.radius],
    mass: 0.01,
    type: "Dynamic",
    position: [0, -999, 0],
    collisionFilterGroup: 0x0010, // enemy bullets
    collisionFilterMask: 0x0001,  // world only (we do proximity for player)
    linearDamping: 0,
    angularDamping: 1,
  }));

  const tmp = useMemo(() => ({
    pos: new Vector3(),
    p: new Vector3(),
  }), []);

  const handle = useMemo<EnemyBulletHandle>(() => ({
    index,
    activate: (origin, dir) => {
      setActive(true);
      ttlRef.current = cfg.ttl;
      api.position.set(origin[0], origin[1], origin[2]);
      api.velocity.set(dir[0] * cfg.speed, dir[1] * cfg.speed, dir[2] * cfg.speed);
    },
    deactivate: () => {
      setActive(false);
      ttlRef.current = 0;
      api.velocity.set(0, 0, 0);
      api.position.set(0, -999, 0);
    },
    isActive: () => active,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [active, api, cfg.speed, cfg.ttl]);

  const register = useEnemyBulletStore((s) => s.register);
  const unregister = useEnemyBulletStore((s) => s.unregister);
  useEffect(() => {
    register(index, handle);
    return () => unregister(index);
  }, [index, handle, register, unregister]);

  useFrame((_, dt) => {
    if (!active) return;

    // lifetime
    ttlRef.current -= dt;
    if (ttlRef.current <= 0) {
      handle.deactivate();
      return;
    }

    // === Sphere–sphere hit: bullet vs player ===
    // bullet center
    ref.current!.getWorldPosition(tmp.pos);
    // player center (from physics body)
    const p = playerPosRef.current;
    tmp.p.set(p[0], p[1], p[2]);

    const r = config.player.hitRadius + cfg.radius;
    if (tmp.pos.distanceToSquared(tmp.p) <= r * r) {
      useGameStore.getState().damagePlayer(cfg.damage);
      handle.deactivate();
    }
  });

  return (
    <mesh ref={ref} castShadow visible={active}>
      <sphereGeometry args={[cfg.radius, 8, 8]} />
      <meshStandardMaterial color={cfg.color} />
    </mesh>
  );
}

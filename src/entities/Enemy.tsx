// src/entities/Enemy.tsx
import { useCylinder } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Vector3, Object3D } from "three";
import { config } from "../config";
import { useEnemyStore, type EnemyHandle } from "../store/enemyStore";
import { useEnemyBulletStore } from "../store/enemyBulletStore";
import { useAmmoPickupStore } from "../store/ammoPickupStore";

type V3 = [number, number, number];

const ENEMY_RADIUS = 0.35;
const ENEMY_HEIGHT = 1.6;

function length2D(x: number, z: number) {
  return Math.hypot(x, z);
}

export const Enemy = memo(function Enemy({
  index,
  playerPosRef,
  aiEnabled = true,
}: {
  index: number;
  playerPosRef: MutableRefObject<V3>;
  aiEnabled?: boolean; // gate AI and shooting (e.g., locked && !gameOver)
}) {
  const enemyCfg = config.enemies;
  const fireCfg = config.enemies.fire;

  const [active, setActive] = useState(false);
  const [health, setHealth] = useState(0);

  // gates
  const [landed, setLanded] = useState(false);
  const landedRef = useRef(false);
  const aliveRef = useRef(false); // prevent double-death emits in the same tick

  // physics body
  const [ref, api] = useCylinder(() => ({
    args: [ENEMY_RADIUS, ENEMY_RADIUS, ENEMY_HEIGHT, 12],
    mass: enemyCfg.mass,
    type: "Dynamic",
    position: [0, -999, 0],
    fixedRotation: true,
    linearDamping: enemyCfg.linearDamping,
    angularDamping: enemyCfg.angularDamping,
    // avoid enemy–enemy collisions (steering handles spacing)
    collisionFilterGroup: enemyCfg.collision.group,
    collisionFilterMask: enemyCfg.collision.mask,
  }));

  // tag the object for gun raycast damage
  useEffect(() => {
    if (ref.current) (ref.current as Object3D).userData.enemyIndex = index;
  }, [ref, index]);

  // current velocity cache
  const vel = useRef<V3>([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (vel.current = v as V3)), [api.velocity]);

  // pooling helpers
  const setInactive = () => {
    setActive(false);
    setHealth(0);
    setLanded(false);
    landedRef.current = false;
    aliveRef.current = false;
    api.velocity.set(0, 0, 0);
    api.position.set(0, -999, 0);
  };

  // temp vectors
  const tmp = useMemo(
    () => ({
      toPlayer: new Vector3(),
      toOther: new Vector3(),
      steer: new Vector3(),
      sumSep: new Vector3(),
      world: new Vector3(),
      shotDir: new Vector3(),
    }),
    []
  );
  const killPos = useMemo(() => new Vector3(), []);

  // enemy pool registration
  const handle: EnemyHandle = useMemo(
    () => ({
      index,
      activate: (pos) => {
        setHealth(enemyCfg.health);
        setActive(true);
        setLanded(false);
        landedRef.current = false;
        aliveRef.current = true;
        api.position.set(pos[0], pos[1], pos[2]);
        api.velocity.set(0, 0, 0);
      },
      damage: (amount) => {
        if (!aliveRef.current) return false;
        let diedNow = false;
        setHealth((h) => {
          const nh = h - amount;
          if (nh <= 0 && aliveRef.current) {
            diedNow = true;
            aliveRef.current = false;

            // spawn ammo pickups at death position (if pool mounted)
            if (ref.current) ref.current.getWorldPosition(killPos);
            const y = killPos.y + 0.35; // slightly above ground
            const drops = Math.max(0, config.pickups.perKillDrops);
            for (let i = 0; i < drops; i++) {
              const jx = (Math.random() - 0.5) * 0.4;
              const jz = (Math.random() - 0.5) * 0.4;
              useAmmoPickupStore.getState().spawnAt([killPos.x + jx, y, killPos.z + jz]);
            }

            setInactive(); // return to pool
            useEnemyStore.getState()._emitKilled(index); // score + spaceship replacement
            return 0;
          }
          return nh;
        });
        return diedNow;
      },
      deactivate: () => setInactive(),
      getObject3D: () => ref.current,
      isActive: () => active,
    }),
    [active, api, ref, enemyCfg.health, index, killPos]
  );

  const register = useEnemyStore((s) => s.register);
  const unregister = useEnemyStore((s) => s.unregister);
  useEffect(() => {
    register(index, handle);
    return () => unregister(index);
  }, [index, handle, register, unregister]);

  // shooting timers
  const fireTimer = useRef(0);
  const burstLeft = useRef(0);
  const burstGap = useRef(0);

  // cached world position for AI
  const worldPos = useRef<V3>([0, ENEMY_HEIGHT / 2, 0]);

  useFrame((_, dt) => {
    if (!active) return;

    // world position update
    if (ref.current) {
      ref.current.getWorldPosition(tmp.world);
      worldPos.current = [tmp.world.x, tmp.world.y, tmp.world.z];
    }

    // detect landing (Y at rest near ground, small vertical speed)
    if (!landedRef.current) {
      const y = worldPos.current[1];
      const vy = vel.current[1];
      const nearGroundHeight = ENEMY_HEIGHT / 2 + 0.08;
      const slowVertically = Math.abs(vy) < 0.2;
      if (y <= nearGroundHeight && slowVertically) {
        landedRef.current = true;
        setLanded(true);
      }
    }

    // pause AI until landed & enabled
    if (!aiEnabled || !landedRef.current) {
      api.velocity.set(0, vel.current[1], 0);
      return;
    }

    // ============ SEEK + SEPARATION ============
    const ppos = playerPosRef.current;
    const [ex, , ez] = worldPos.current;

    // seek toward player until stopDistance
    tmp.toPlayer.set(ppos[0] - ex, 0, ppos[2] - ez);
    const dist = tmp.toPlayer.length();
    tmp.steer.set(0, 0, 0);
    if (dist > enemyCfg.stopDistance) {
      tmp.toPlayer.normalize().multiplyScalar(enemyCfg.speed);
      tmp.steer.add(tmp.toPlayer);
    }

    // separation from other enemies
    const handles = useEnemyStore.getState().handles;
    tmp.sumSep.set(0, 0, 0);
    let count = 0;
    for (const h of handles) {
      if (!h || h.index === index || !h.isActive()) continue;
      const obj = h.getObject3D();
      if (!obj) continue;
      obj.getWorldPosition(tmp.toOther);
      const dx = ex - tmp.toOther.x;
      const dz = ez - tmp.toOther.z;
      const d = length2D(dx, dz);
      if (d > 0 && d < enemyCfg.separationRadius) {
        tmp.sumSep.addScaledVector(
          tmp.toOther.set(dx, 0, dz).normalize(),
          (enemyCfg.separationRadius - d) / enemyCfg.separationRadius
        );
        count++;
      }
    }
    if (count > 0) {
      tmp.sumSep.divideScalar(count).normalize().multiplyScalar(enemyCfg.sepStrength);
      tmp.steer.add(tmp.sumSep);
    }

    // apply XZ velocity, keep Y from physics
    if (tmp.steer.lengthSq() > 0.0001) {
      tmp.steer.normalize().multiplyScalar(enemyCfg.speed);
      api.velocity.set(tmp.steer.x, vel.current[1], tmp.steer.z);
    } else {
      const hv = Math.hypot(vel.current[0], vel.current[2]);
      if (hv > 0.2) api.velocity.set(vel.current[0] * 0.9, vel.current[1], vel.current[2] * 0.9);
      else api.velocity.set(0, vel.current[1], 0);
    }

    // ============ SHOOTING ============
    fireTimer.current += dt;

    if (burstLeft.current > 0) {
      burstGap.current -= dt;
      if (burstGap.current <= 0) {
        shootAtPlayer();
        burstLeft.current -= 1;
        burstGap.current = Math.max(0.01, fireCfg.burstGap);
      }
    } else if (fireTimer.current >= fireCfg.interval) {
      fireTimer.current = 0;
      if (fireCfg.mode === "burst") {
        burstLeft.current = Math.max(1, fireCfg.burstCount);
        burstGap.current = 0; // fire first bullet immediately
      } else {
        shootAtPlayer();
      }
    }
  });

  const shootAtPlayer = () => {
    if (!ref.current) return;
    // origin slightly above body center (like a chest muzzle)
    ref.current.getWorldPosition(tmp.world);
    const origin: V3 = [tmp.world.x, tmp.world.y + ENEMY_HEIGHT * 0.35, tmp.world.z];

    // aim at player's upper body
    const p = playerPosRef.current;
    tmp.shotDir.set(
      p[0] - origin[0],
      (p[1] + config.player.height * 0.5) - origin[1],
      p[2] - origin[2]
    ).normalize();

    useEnemyBulletStore
      .getState()
      .spawn(origin, [tmp.shotDir.x, tmp.shotDir.y, tmp.shotDir.z]);
  };

  return (
    <mesh ref={ref} castShadow visible={active}>
      <cylinderGeometry args={[ENEMY_RADIUS, ENEMY_RADIUS, ENEMY_HEIGHT, 12]} />
      <meshStandardMaterial color={config.enemies.color} />
    </mesh>
  );
});

import { useCylinder } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Vector3, Object3D } from "three";
import { config } from "../config";
import { useEnemyStore, type EnemyHandle } from "../store/enemyStore";
import { useAmmoPickupStore } from "../store/ammoPickupStore";

type V3 = [number, number, number];

const ENEMY_RADIUS = 0.35;
const ENEMY_HEIGHT = 1.6;

function length2D(x: number, z: number) { return Math.hypot(x, z); }

export const Enemy = memo(function Enemy({
  index,
  playerPosRef,
  aiEnabled = true,
}: {
  index: number;
  playerPosRef: MutableRefObject<V3>;
  aiEnabled?: boolean;
}) {
  const enemyCfg = config.enemies;
  const [active, setActive] = useState(false);
  const [health, setHealth] = useState(0);

  const [landed, setLanded] = useState(false);
  const landedRef = useRef(false);
  const aliveRef = useRef(false);

  const [ref, api] = useCylinder(() => ({
    args: [ENEMY_RADIUS, ENEMY_RADIUS, ENEMY_HEIGHT, 12],
    mass: enemyCfg.mass,
    type: "Dynamic",
    position: [0, -999, 0],
    fixedRotation: true,
    linearDamping: enemyCfg.linearDamping,
    angularDamping: enemyCfg.angularDamping,
    collisionFilterGroup: enemyCfg.collision.group,
    collisionFilterMask: enemyCfg.collision.mask,
  }));

  useEffect(() => {
    if (ref.current) (ref.current as Object3D).userData.enemyIndex = index;
  }, [ref, index]);

  const vel = useRef<V3>([0,0,0]);
  useEffect(() => api.velocity.subscribe((v) => (vel.current = v as V3)), [api.velocity]);

  const setInactive = () => {
    setActive(false);
    setHealth(0);
    setLanded(false);
    landedRef.current = false;
    aliveRef.current = false;
    api.velocity.set(0,0,0);
    api.position.set(0, -999, 0);
  };

  const killPos = useMemo(() => new Vector3(), []);

  const handle: EnemyHandle = useMemo(() => ({
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
          // read world position for pickups
          if (ref.current) ref.current.getWorldPosition(killPos);
          const y = killPos.y + 0.3;
          for (let i = 0; i < config.pickups.perKillDrops; i++) {
            useAmmoPickupStore.getState().spawnAt([killPos.x, y, killPos.z]);
          }
          aliveRef.current = false;
          setInactive();
          useEnemyStore.getState()._emitKilled(index);
          return 0;
        }
        return nh;
      });
      return diedNow;
    },
    deactivate: () => setInactive(),
    getObject3D: () => ref.current,
    isActive: () => active,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [active, api, ref, enemyCfg.health, killPos]);

  const register = useEnemyStore((s) => s.register);
  const unregister = useEnemyStore((s) => s.unregister);
  useEffect(() => {
    register(index, handle);
    return () => unregister(index);
  }, [index, handle, register, unregister]);

  const tmp = useMemo(() => ({
    toPlayer: new Vector3(),
    toOther: new Vector3(),
    steer: new Vector3(),
    sumSep: new Vector3(),
  }), []);

  const worldPos = useRef<V3>([0, ENEMY_HEIGHT/2, 0]);

  useFrame(() => {
    if (!active) return;

    if (ref.current) {
      ref.current.getWorldPosition(tmp.toPlayer);
      worldPos.current = [tmp.toPlayer.x, tmp.toPlayer.y, tmp.toPlayer.z];
    }

    if (!landedRef.current) {
      const y = worldPos.current[1];
      const vy = vel.current[1];
      const nearGroundHeight = ENEMY_HEIGHT / 2 + 0.08;
      const slowVert = Math.abs(vy) < 0.2;
      if (y <= nearGroundHeight && slowVert) {
        landedRef.current = true;
        setLanded(true);
      }
    }

    if (!aiEnabled || !landedRef.current) {
      api.velocity.set(0, vel.current[1], 0);
      return;
    }

    const ppos = playerPosRef.current;
    const [ex, , ez] = worldPos.current;

    tmp.toPlayer.set(ppos[0] - ex, 0, ppos[2] - ez);
    const dist = tmp.toPlayer.length();
    tmp.steer.set(0, 0, 0);
    if (dist > enemyCfg.stopDistance) {
      tmp.toPlayer.normalize().multiplyScalar(enemyCfg.speed);
      tmp.steer.add(tmp.toPlayer);
    }

    const handles = useEnemyStore.getState().handles;
    tmp.sumSep.set(0,0,0);
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
        tmp.sumSep.addScaledVector(tmp.toOther.set(dx, 0, dz).normalize(), (enemyCfg.separationRadius - d) / enemyCfg.separationRadius);
        count++;
      }
    }
    if (count > 0) {
      tmp.sumSep.divideScalar(count).normalize().multiplyScalar(enemyCfg.sepStrength);
      tmp.steer.add(tmp.sumSep);
    }

    if (tmp.steer.lengthSq() > 0.0001) {
      tmp.steer.normalize().multiplyScalar(enemyCfg.speed);
      api.velocity.set(tmp.steer.x, vel.current[1], tmp.steer.z);
    } else {
      const hv = Math.hypot(vel.current[0], vel.current[2]);
      if (hv > 0.2) api.velocity.set(vel.current[0]*0.9, vel.current[1], vel.current[2]*0.9);
      else api.velocity.set(0, vel.current[1], 0);
    }
  });

  return (
    <mesh ref={ref} castShadow visible={active}>
      <cylinderGeometry args={[ENEMY_RADIUS, ENEMY_RADIUS, ENEMY_HEIGHT, 12]} />
      <meshStandardMaterial color={config.enemies.color} />
    </mesh>
  );
});

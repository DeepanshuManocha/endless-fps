// src/entities/Gun.tsx (or ./Gun.tsx if you keep files at project root)
import { useSphere } from "@react-three/cannon";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { config } from "../config";
import { useGunStore } from "../store/gunStore";         
import { Vector3, Vector2, Raycaster, Mesh } from "three";
import { useEnemyStore } from "../store/enemyStore";

const BULLET_RADIUS = 0.07;
const BULLET_TTL = 3.0;       // seconds before auto-despawn
const SPAWN_OFFSET = 0.6;     // forward nudge so bullet doesn't hit us

type BulletApi = ReturnType<typeof useSphere>[1];
type Vec3Tuple = [number, number, number];

function bulletInit(i: number) {
  return { id: i, active: false, ttl: 0 };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function Gun({
  playerPosRef,
  enabled,
}: {
  playerPosRef: MutableRefObject<Vec3Tuple>;
  enabled: boolean;
}) {
  const { scene, camera } = useThree();
  const gun = config.gun;
  const N = gun.poolSize;

  // pool state
  const [bullets, setBullets] = useState(() => Array.from({ length: N }, (_, i) => bulletInit(i)));
  const meshRefs = useRef<(Mesh | null)[]>(Array.from({ length: N }, () => null));
  const apis = useRef<(BulletApi | null)[]>(Array.from({ length: N }, () => null));

  const register = (i: number, ref: MutableRefObject<Mesh | null>, api: BulletApi) => {
    meshRefs.current[i] = ref.current;
    apis.current[i] = api;
  };

  const centerNDC = useMemo(() => new Vector2(0, 0), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  const shootDir = useMemo(() => new Vector3(), []);
  const spawnPos = useMemo(() => new Vector3(), []);

  const [mag, setMag] = useState(gun.magazineSize);
  const [reserve, setReserve] = useState(gun.totalBullets);
  const [reloading, setReloading] = useState(false);
  const triggerHeld = useRef(false);
  const timeSinceLastShot = useRef(0);

  const setHUD = useGunStore((s) => s.set);

  // Listen for ammo pickups -> add to current magazine (clamped)
  useEffect(() => {
  const onPickup = (e: Event) => {
    const amount = (e as CustomEvent).detail?.amount ?? 0;
    setReserve((r) => r + amount);   // ✅ increment reserve
  };
  window.addEventListener("ammo-pickup", onPickup as EventListener);
  return () => window.removeEventListener("ammo-pickup", onPickup as EventListener);
}, []);

  const canFire = () =>
    enabled &&
    !reloading &&
    (gun.infiniteBullets || mag > 0 || gun.ignoreReload || reserve > 0);

  const startReload = () => {
    if (reloading || gun.ignoreReload) return;
    if (gun.infiniteBullets ? mag >= gun.magazineSize : reserve <= 0 || mag >= gun.magazineSize) return;

    setReloading(true);
    setHUD({ reloading: true, reloadEta: performance.now() + gun.reloadTime * 1000 });

    window.setTimeout(() => {
      setReloading(false);
      setHUD({ reloading: false, reloadEta: 0 });
      if (gun.infiniteBullets) {
        setMag(gun.magazineSize);
      } else {
        setMag((m) => {
          const take = clamp(gun.magazineSize - m, 0, reserve);
          setReserve((r) => r - take);
          return m + take;
        });
      }
    }, gun.reloadTime * 1000);
  };

  // fire loop
  useFrame((_, dt) => {
    if (!enabled) return;

    timeSinceLastShot.current += dt;
    const shotDelay = 1 / gun.fireRate;

    const shouldShoot =
      triggerHeld.current &&
      canFire() &&
      timeSinceLastShot.current >= shotDelay;

    if (!shouldShoot) return;
    timeSinceLastShot.current = 0;

    // camera position + forward
    const camPos = new Vector3();
    camera.getWorldPosition(camPos);
    const camFwd = new Vector3();
    camera.getWorldDirection(camFwd).normalize();

    // center-screen raycast to pick target point
    raycaster.setFromCamera(centerNDC, camera);

    // ignore our bullet meshes
    const bulletMeshes = new Set<Mesh>(meshRefs.current.filter((m): m is Mesh => !!m));
    const hits = raycaster.intersectObjects(scene.children, true);
    const firstHit = hits.find(
      (h) => !(h.object instanceof Mesh && bulletMeshes.has(h.object)) && h.distance > 0.1
    );

    // target: crosshair hit or a far point forward
    const target = firstHit
      ? firstHit.point
      : camPos.clone().add(camFwd.clone().multiplyScalar(1000));

    // Apply damage if we hit an enemy object
    if (firstHit && (firstHit.object as any)?.userData) {
      useEnemyStore.getState().hitByObject(firstHit.object, gun.damage);
    }

    // spawn from the eye, nudge forward so we don't collide with our own collider
    const ORIGIN_OFFSET = 0.15;
    const origin = spawnPos.copy(camPos).addScaledVector(camFwd, ORIGIN_OFFSET);

    // direction: origin -> target
    shootDir.copy(target).sub(origin).normalize();

    if (spawnBullet(origin, shootDir)) {
      if (!gun.infiniteBullets) setMag((m) => Math.max(0, m - 1));
    }
  });

  // inputs — reattach when values used by startReload change (avoid stale closures)
  useEffect(() => {
    if (!enabled) {
      triggerHeld.current = false;
      return;
    }
    const onDown = () => {
      if (!enabled) return;
      if (gun.fireMode === "semi") {
        attemptShootOnce();
      } else {
        triggerHeld.current = true;
      }
    };
    const onUp = () => { triggerHeld.current = false; };
    const onKey = (e: KeyboardEvent) => { if (e.code === "KeyR") startReload(); };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
      triggerHeld.current = false;
    };
  }, [
    enabled,
    gun.fireMode,
    gun.reloadTime,
    gun.ignoreReload,
    gun.infiniteBullets,
    gun.magazineSize,
    mag,
    reserve,
    reloading,
  ]);

  // update HUD when ammo changes
  useEffect(() => {
    setHUD({
      magazine: mag,
      reserve,
      magazineSize: gun.magazineSize,
      infinite: gun.infiniteBullets,
    });
  }, [mag, reserve, gun.magazineSize, gun.infiniteBullets, setHUD]);

  // auto-reload when empty
  useEffect(() => {
    if (!reloading && !gun.ignoreReload && mag <= 0 && (gun.infiniteBullets || reserve > 0)) {
      startReload();
    }
  }, [mag, reserve, reloading, gun.ignoreReload, gun.infiniteBullets]);

  // ================================
  // Bullet Pool helpers
  // ================================
  function spawnBullet(origin: Vector3, dir: Vector3) {
    const i = bullets.findIndex((b) => !b.active);
    if (i === -1) return false;

    const api = apis.current[i];
    if (!api) return false; // not mounted yet

    const spawn = origin.clone().addScaledVector(dir, SPAWN_OFFSET);

    api.position.set(spawn.x, spawn.y, spawn.z);
    api.velocity.set(
      dir.x * config.gun.bulletSpeed,
      dir.y * config.gun.bulletSpeed,
      dir.z * config.gun.bulletSpeed
    );

    setBullets((arr) => {
      const next = arr.slice();
      next[i] = { id: i, active: true, ttl: BULLET_TTL };
      return next;
    });

    return true;
  }

  const onImpact = (i: number) => {
    // mark inactive + reset body
    setBullets((arr) => {
      if (!arr[i]?.active) return arr;
      const next = arr.slice();
      next[i] = { ...next[i], active: false, ttl: 0 };
      return next;
    });
    const api = apis.current[i];
    if (api) {
      api.velocity.set(0, 0, 0);
      api.position.set(0, -999, 0);
    }
  };

  // per-frame TTL update & cleanup
  useFrame((_, dt) => {
    setBullets((arr) => {
      let anyExpired = false;
      const next = arr.map((b) => {
        if (!b.active) return b;
        const ttl = b.ttl - dt;
        if (ttl <= 0) {
          anyExpired = true;
          return { ...b, active: false, ttl: 0 };
        }
        return { ...b, ttl };
      });
      if (anyExpired) {
        next.forEach((b, i) => {
          if (!b.active && arr[i].active) {
            const api = apis.current[i];
            if (api) {
              api.velocity.set(0, 0, 0);
              api.position.set(0, -999, 0);
            }
          }
        });
      }
      return next;
    });
  });

  const attemptShootOnce = () => {
    if (!canFire()) return;
    timeSinceLastShot.current = 9999; // force immediate fire in next frame
  };

  // render pool
  return (
    <>
      {Array.from({ length: N }).map((_, i) => (
        <Bullet key={i} index={i} register={register} onImpact={onImpact} />
      ))}
    </>
  );
}

function Bullet({
  index,
  register,
  onImpact,
}: {
  index: number;
  register: (i: number, ref: MutableRefObject<Mesh | null>, api: BulletApi) => void;
  onImpact: (i: number) => void;
}) {
  const [ref, api] = useSphere(() => ({
    args: [BULLET_RADIUS],
    mass: 0.01,
    type: "Dynamic",
    position: [0, -999, 0],
    collisionFilterGroup: 0x0004,          // bullet group
    collisionFilterMask: 0x0001 | 0x0002,  // world + enemies
    onCollide: () => onImpact(index),
  }));

  useEffect(() => {
    register(index, ref as unknown as MutableRefObject<Mesh | null>, api);
  }, [index, ref, api, register]);

  return (
    <mesh ref={ref as unknown as MutableRefObject<Mesh | null>} castShadow>
      <sphereGeometry args={[BULLET_RADIUS, 16, 16]} />
      <meshStandardMaterial color="#eeeeee" />
    </mesh>
  );
}

export { Gun };

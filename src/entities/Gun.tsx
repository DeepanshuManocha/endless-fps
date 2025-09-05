// src/entities/Gun.tsx
import { useSphere } from "@react-three/cannon";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import { config } from "../config";
import { useGunStore } from "../store/gunStore";
import { Vector3, Vector2, Raycaster, Mesh } from "three";

const BULLET_RADIUS = 0.07;
const BULLET_TTL = 3.0;       // seconds before auto-despawn
const SPAWN_OFFSET = 0.6;     // meters forward to avoid self-hit

type BulletApi = ReturnType<typeof useSphere>[1];
type Vec3Tuple = [number, number, number];
type PlayerPosRef = RefObject<Vec3Tuple> | MutableRefObject<Vec3Tuple>;

type Props = {
  /** Optional external player position ref: [x, y, z] */
  playerPosRef?: PlayerPosRef;
};

function Bullet({
  index,
  register,
  onImpact,
}: {
  index: number;
  register: (i: number, ref: MutableRefObject<Mesh | null>, api: BulletApi) => void;
  onImpact: (i: number) => void;
}) {
  const [ref, api] = useSphere<Mesh>(() => ({
    args: [BULLET_RADIUS],
    mass: 0.05,
    position: [0, -1000, 0], // parked off-world
    type: "Dynamic",
    onCollide: () => onImpact(index),
    linearDamping: 0,
    angularDamping: 0,
    allowSleep: true,
  }));

  useEffect(() => {
    register(index, ref, api);
  }, [index, register, api, ref]);

  return (
    <mesh ref={ref} visible={false} castShadow>
      <sphereGeometry args={[BULLET_RADIUS, 12, 12]} />
      <meshStandardMaterial color="#ffd54f" />
    </mesh>
  );
}

function Gun({  }: Props) {
  const { camera, scene } = useThree();

  const raycaster = useMemo(() => new Raycaster(), []);
  const centerNDC = useMemo(() => new Vector2(0, 0), []);


  const gun = config.gun;


  // bullet pool
  const N = gun.poolSize;
  const meshRefs = useRef<(Mesh | null)[]>(Array(N).fill(null));
  const apis = useRef<BulletApi[]>(Array(N));
  const active = useRef<boolean[]>(Array(N).fill(false));
  const dieAt = useRef<number[]>(Array(N).fill(0));

  const spawnPos = useMemo(() => new Vector3(), []);
  const shootDir = useMemo(() => new Vector3(), []);

  const register = (i: number, ref: MutableRefObject<Mesh | null>, api: BulletApi) => {
    meshRefs.current[i] = ref.current;
    apis.current[i] = api;
  };

  const deactivate = (i: number) => {
    if (!active.current[i]) return;
    active.current[i] = false;
    dieAt.current[i] = 0;
    apis.current[i].velocity.set(0, 0, 0);
    apis.current[i].angularVelocity.set(0, 0, 0);
    apis.current[i].position.set(0, -1000, 0); // park
    const mesh = meshRefs.current[i];
    if (mesh) mesh.visible = false;
  };

  const onImpact = (i: number) => deactivate(i);

  const spawnBullet = (origin: Vector3, dir: Vector3) => {
    // find free slot
    let idx = -1;
    for (let i = 0; i < N; i++) {
      if (!active.current[i]) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return false;

    const api = apis.current[idx];
    const mesh = meshRefs.current[idx];
    if (!api) return false;

    // spawn
    spawnPos.copy(origin).addScaledVector(dir, SPAWN_OFFSET);
    api.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
    api.velocity.set(dir.x * gun.bulletSpeed, dir.y * gun.bulletSpeed, dir.z * gun.bulletSpeed);
    api.angularVelocity.set(0, 0, 0);
    active.current[idx] = true;
    dieAt.current[idx] = performance.now() + BULLET_TTL * 1000;
    if (mesh) mesh.visible = true;
    return true;
  };

  const [mag, setMag] = useState(gun.magazineSize);
  const [reserve, setReserve] = useState(gun.totalBullets);
  const [reloading, setReloading] = useState(false);
  const triggerHeld = useRef(false);
  const timeSinceLastShot = useRef(0);

  const setHUD = useGunStore((s) => s.set);

  const canFire = () =>
    !reloading &&
    (gun.infiniteBullets || mag > 0 || gun.ignoreReload || reserve > 0);

  const startReload = () => {
    if (reloading) return;
    if (gun.ignoreReload) return; // reload irrelevant
    if (gun.infiniteBullets) {
      if (mag >= gun.magazineSize) return; // already full
    } else {
      if (reserve <= 0) return; // nothing to reload from
      if (mag >= gun.magazineSize) return; // already full
    }

    setReloading(true);
    setHUD({ reloading: true, reloadEta: performance.now() + gun.reloadTime * 1000 });

    window.setTimeout(() => {
      setReloading(false);
      setHUD({ reloading: false, reloadEta: 0 });

      const need = gun.magazineSize - mag;
      if (need <= 0) return;

      if (gun.infiniteBullets) {
        setMag(gun.magazineSize);
      } else {
        const take = Math.min(need, reserve);
        setReserve((r) => r - take);
        setMag((m) => m + take);
      }
    }, gun.reloadTime * 1000);
  };

    const tryFireOnce = () => {
    if (!canFire()) return;

    // ammo handling (unchanged) …
    if (mag <= 0) {
      if (gun.ignoreReload) {
        if (!gun.infiniteBullets && reserve <= 0) return;
        const need = gun.magazineSize;
        if (gun.infiniteBullets) setMag(need);
        else {
          const take = Math.min(need, reserve);
          setReserve((r) => r - take);
          setMag(take);
        }
      } else {
        if (!reloading && (gun.infiniteBullets || reserve > 0)) startReload();
        return;
      }
    }
    // Direction = camera forward
    camera.getWorldDirection(shootDir).normalize();

    // Camera world position
    const camPos = new Vector3();
    camera.getWorldPosition(camPos);

    const camFwd = new Vector3();
    camera.getWorldDirection(camFwd).normalize();

    // 2) raycast from screen center to find what the crosshair hits
    raycaster.setFromCamera(centerNDC, camera);

    // (optional) ignore our bullet pool meshes
    // Build a set of the current bullet meshes
const bulletMeshes = new Set<Mesh>(meshRefs.current.filter((m): m is Mesh => !!m));

// raycast from center
raycaster.setFromCamera(centerNDC, camera);
const hits = raycaster.intersectObjects(scene.children, true);

const firstHit = hits.find(
  (h) => !(h.object instanceof Mesh && bulletMeshes.has(h.object)) && h.distance > 0.1
);

    // 3) choose target point (hit or far point straight ahead)
    const target = firstHit
    ? firstHit.point
    : camPos.clone().add(camFwd.clone().multiplyScalar(1000));

    // 4) spawn from the eye, nudged forward to avoid self-collision
    const ORIGIN_OFFSET = 0.15; // meters in front of the eye
    spawnPos.copy(camPos).addScaledVector(camFwd, ORIGIN_OFFSET);

    // 5) direction from muzzle → target (so bullets converge to the crosshair)
    shootDir.copy(target).sub(spawnPos).normalize();

    if (spawnBullet(spawnPos, shootDir)) {
    if (!gun.infiniteBullets) setMag(m => Math.max(0, m - 1));
    }

  };

  // inputs
  useEffect(() => {
  const onDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    if (gun.fireMode === "semi") {
      // one shot per click
      tryFireOnce();
      return;
    }

    // AUTO: fire immediately on press, then keep spraying at fireRate
    triggerHeld.current = true;
    tryFireOnce();
    timeSinceLastShot.current = 0; // start cadence from now
  };

  const onUp = (e: MouseEvent) => {
    if (e.button === 0) triggerHeld.current = false;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.code === "KeyR") startReload();
  };

  window.addEventListener("mousedown", onDown);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("keydown", onKey);
  return () => {
    window.removeEventListener("mousedown", onDown);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("keydown", onKey);
  };
}, [gun.fireMode, gun.reloadTime, gun.ignoreReload, gun.infiniteBullets, mag, reserve, reloading]);


  // update HUD when ammo changes
  useEffect(() => {
    setHUD({
      magazine: mag,
      reserve,
      magazineSize: gun.magazineSize,
      infinite: gun.infiniteBullets,
    });
  }, [mag, reserve, gun.magazineSize, gun.infiniteBullets, setHUD]);

  // auto-reload when magazine empties and we have ammo/infinite
  useEffect(() => {
    if (!reloading && !gun.ignoreReload && mag <= 0 && (gun.infiniteBullets || reserve > 0)) {
      startReload();
    }
  }, [mag, reserve, reloading, gun.ignoreReload, gun.infiniteBullets]);

  // auto fire cadence + TTL cleanup
  useFrame((_, dt) => {
    if (gun.fireMode === "auto" && triggerHeld.current && !reloading) {
      timeSinceLastShot.current += dt;
      const interval = 1 / gun.fireRate;
      while (timeSinceLastShot.current >= interval) {
        tryFireOnce();
        timeSinceLastShot.current -= interval;
      }
    } else {
      timeSinceLastShot.current = 0;
    }

    const now = performance.now();
    for (let i = 0; i < N; i++) {
      if (active.current[i] && dieAt.current[i] <= now) deactivate(i);
    }
  });

  // render pool
  return (
    <>
      {Array.from({ length: N }).map((_, i) => (
        <Bullet key={i} index={i} register={register} onImpact={onImpact} />
      ))}
    </>
  );
}

export default Gun;
export { Gun };

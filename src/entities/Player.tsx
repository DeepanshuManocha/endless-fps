import { useCylinder } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { config } from "../config";

type V3 = [number, number, number];

const BODY_RADIUS = 0.4;
const BODY_HEIGHT = 1.8;

export default function Player() {
  const [ref, api] = useCylinder(() => ({
    args: [BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 16],
    mass: config.player.mass,
    position: [0, BODY_HEIGHT / 2, 0] as V3,
    fixedRotation: true,
    linearDamping: config.player.linearDamping,
    angularDamping: config.player.angularDamping,
    allowSleep: false,
  }));

  const pos = useRef<V3>([0, BODY_HEIGHT / 2, 0]);
  const vel = useRef<V3>([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (pos.current = p as V3)), [api.position]);
  useEffect(() => api.velocity.subscribe((v) => (vel.current = v as V3)), [api.velocity]);

  const input = useRef({ f: false, b: false, l: false, r: false });
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") input.current.f = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") input.current.b = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") input.current.l = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") input.current.r = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") input.current.f = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") input.current.b = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") input.current.l = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") input.current.r = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const { camera } = useThree();
  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const dir = useMemo(() => new Vector3(), []);
  const camFlatForward = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const [x, y, z] = pos.current;

    // flat look direction (XZ)
    camFlatForward.set(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();

    // keep your exact camera position behavior
    const camBaseY = y + BODY_HEIGHT * config.player.cameraHeightRatio + config.player.camUp;
    camera.position.set(
      x - camFlatForward.x * config.player.camBack,
      camBaseY,
      z - camFlatForward.z * config.player.camBack
    );

    // 🔒 lock pitch: look straight ahead at same height (no up/down)
    lookTarget.copy(camera.position).add(camFlatForward); // straight ahead
    lookTarget.y = camera.position.y;                     // same height => zero pitch
    camera.lookAt(lookTarget);

    // movement in camera space (already flattened)
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
    right.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();

    dir.set(0, 0, 0);
    if (input.current.f) dir.add(forward);
    if (input.current.b) dir.sub(forward);
    if (input.current.l) dir.sub(right);
    if (input.current.r) dir.add(right);

    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(config.player.speed);
      api.velocity.set(dir.x, vel.current[1], dir.z);
    } else if (Math.hypot(vel.current[0], vel.current[2]) < 0.2) {
      api.velocity.set(0, vel.current[1], 0);
    }
  });

  return (
    <mesh ref={ref} castShadow>
      <cylinderGeometry args={[BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 16]} />
      <meshStandardMaterial color={config.player.color} />
    </mesh>
  );
}

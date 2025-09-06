import { useBox } from "@react-three/cannon";
import { config } from "../config";
import { memo, useMemo } from "react";

const Wall = memo(function Wall({
  args,
  position,
  rotation = [0, 0, 0],
  color,
}: {
  args: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  const [ref] = useBox(() => ({ args, position, rotation, type: "Static" }));
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
});

export default function Boundaries() {
  const { width, depth } = config.ground;
  const { height: wallH, thickness: t, color } = config.walls;

  // compute once per render from config (supports HMR/live changes)
  const { northPos, southPos, eastPos, westPos } = useMemo(() => {
    const halfW = width / 2;
    const halfD = depth / 2;

    // walls sit ON the ground (ground top is y = 0), so center at wallH/2
    const y = wallH / 2;

    // place walls at the inner edges: ±(half - t/2)
    return {
      northPos: [0, y, -(halfD - t / 2)] as [number, number, number],
      southPos: [0, y, +(halfD - t / 2)] as [number, number, number],
      eastPos: [+(halfW - t / 2), y, 0] as [number, number, number],
      westPos: [-(halfW - t / 2), y, 0] as [number, number, number],
    };
  }, [width, depth, wallH, t]);

  return (
    <>
      {/* North/South span X, thin in Z */}
      <Wall args={[width, wallH, t]} position={northPos} color={color} />
      <Wall args={[width, wallH, t]} position={southPos} color={color} />
      {/* East/West span Z, thin in X */}
      <Wall args={[t, wallH, depth]} position={eastPos} color={color} />
      <Wall args={[t, wallH, depth]} position={westPos} color={color} />
    </>
  );
}

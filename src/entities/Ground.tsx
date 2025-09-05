import { useBox } from "@react-three/cannon";
import { config } from "../config";

export default function Ground() {
  const { width, depth, height, color } = config.ground;
  // static box with its TOP at y=0 (so player y starts at half player height)
  const [ref] = useBox(() => ({
    args: [width, height, depth],
    position: [0, -height / 2, 0],
    type: "Static",
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// src/App.tsx
import { Canvas } from "@react-three/fiber";
import { PointerLockControls, StatsGl } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import Game from "./Game";
import { config } from "./config";
import HUD from "./ui/HuD";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows camera={{ fov: 75, position: [0, 2, 6] }}>
        {/* lights, Physics, Game, controls… */}
        <color attach="background" args={["#202025"]} />
        <ambientLight intensity={0.5} />
        <hemisphereLight intensity={0.7} groundColor={"#222"} />
        <directionalLight position={[10, 12, 6]} intensity={1.2} castShadow />
        <Physics gravity={config.physics.gravity}>
          <Game />
        </Physics>
        <PointerLockControls />
        <StatsGl />
      </Canvas>

      {/* DOM overlay */}
      <HUD />
    </div>
  );
}
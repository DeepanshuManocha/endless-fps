// src/App.tsx
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { PointerLockControls, Stats  } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import Game from "./Game";
import HUD from "./ui/HUD";
import { config } from "./config";
import LegendOverlay from "./ui/LegendOverlay";

export default function App() {
  const [playing, setPlaying] = useState(false);
  const [locked, setLocked] = useState(false);
  const controlsRef = useRef<any>(null);

  const tryLock = () => controlsRef.current?.lock?.();

  const start = (e?: React.PointerEvent | React.MouseEvent) => {
    e?.stopPropagation?.();
    // Mount PLC right now so ref exists, then request lock in same gesture
    flushSync(() => setPlaying(true));
    tryLock();
    // Fallback: some browsers need a tick
    requestAnimationFrame(() => {
      if (!document.pointerLockElement) tryLock();
    });
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows camera={{ fov: 75, position: [0, 2, 6] }}>
        <color attach="background" args={["#202025"]} />
        <ambientLight intensity={0.5} />
        <hemisphereLight intensity={0.7} groundColor={"#222"} />
        <directionalLight position={[10, 12, 6]} intensity={1.2} castShadow />

        <Physics gravity={config.physics.gravity}>
          <Game enabled={playing} locked={locked} />
        </Physics>

        {/* PLC must live inside Canvas */}
        {playing && (
          <PointerLockControls
            ref={controlsRef}
            onLock={() => setLocked(true)}
            onUnlock={() => setLocked(false)}
          />
        )}

      <Stats className="fps-fixed" showPanel={0} />
      </Canvas>

      {/* Start menu (absorbs clicks) */}
      {!playing && (
        <div
          className="menu"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="panel">
            <h1>FPS Endless</h1>
            <button type="button" onPointerDown={start} onClick={start}>
              Play
            </button>
            <p className="hint">WASD to move • Mouse to look • Left click to shoot</p>
          </div>
        </div>
      )}

      {/* HUD: crosshair only when pointer is locked */}
      {playing && <HUD showCrosshair={locked} />}

     {/* While playing but not locked, show a simple clickable text hint */}
     {playing && !locked && <LegendOverlay onLock={tryLock} />}
    </div>
  );
}

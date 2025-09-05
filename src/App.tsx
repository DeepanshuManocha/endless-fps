// src/App.tsx
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { PointerLockControls, StatsGl } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import Game from "./Game";
import HUD from "./ui/HuD";
import { config } from "./config";

export default function App() {
  const [playing, setPlaying] = useState(false);
  const [locked, setLocked] = useState(false);
  const controlsRef = useRef<any>(null);

  const start = () => {
    // 1) Commit 'playing' immediately so PLC is mounted/enabled now
    flushSync(() => setPlaying(true));
    // 2) Request lock in the SAME gesture
    controlsRef.current?.lock?.();
    // Fallback: some browsers are picky—try again next tick if still unlocked
    queueMicrotask(() => {
      if (!document.pointerLockElement) controlsRef.current?.lock?.();
    });
  };

  const onLock = () => setLocked(true);
  const onUnlock = () => setLocked(false);

  // Safety net overlay: if we're playing but somehow not locked (e.g. Esc pressed)
  const needClickToLock = playing && !locked;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows camera={{ fov: 75, position: [0, 2, 6] }}>
        <color attach="background" args={["#202025"]} />
        <ambientLight intensity={0.5} />
        <hemisphereLight intensity={0.7} groundColor={"#222"} />
        <directionalLight position={[10, 12, 6]} intensity={1.2} castShadow />
        <Physics gravity={config.physics.gravity}>
          <Game enabled={playing} />
        </Physics>

        {/* Keep controls always mounted with a ref */}
        <PointerLockControls ref={controlsRef} onLock={onLock} onUnlock={onUnlock} />
        <StatsGl />
      </Canvas>

      {/* Menu */}
      {!playing && (
        <div className="menu">
          <div className="panel">
            <h1>My FPS</h1>
            <button onPointerDown={start}>Play</button>
            <p className="hint">WASD to move • Mouse to look • Click to shoot</p>
          </div>
        </div>
      )}

      {/* HUD (make sure it's click-through while playing) */}
      {playing && <HUD />}

      {/* Click-catcher if not locked yet (or after pressing Esc) */}
      {needClickToLock && (
        <button className="lock-overlay" onPointerDown={() => controlsRef.current?.lock?.()}>
          Click to capture mouse
        </button>
      )}
    </div>
  );
}

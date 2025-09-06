// HUD.tsx
import { useEffect } from "react";
import { useGunStore } from "../store/gunStore";
import { useEnemyStore } from "../store/enemyStore";
import { useGameStore } from "../store/gameStore";
import { config } from "../config";

export default function HUD({ showCrosshair = true }: { showCrosshair?: boolean }) {
  const { magazine, reserve, magazineSize, infinite, reloading } = useGunStore();
  const score = useEnemyStore((s) => s.score);
  const kills = useEnemyStore((s) => s.kills);
  const playerHealth = useGameStore((s) => s.playerHealth);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const gameOver = useGameStore((s) => s.gameOver);

  // Force-exit pointer lock and block any re-lock while Game Over is visible
  useEffect(() => {
    if (!gameOver) return;

    // 1) Make sure pointer lock is OFF so the cursor shows and clicks work
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } catch {}

    // 2) Block clicks from bubbling to any "requestPointerLock" handler while Game Over is up
    const stop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("pointerdown", stop, { capture: true });
    window.addEventListener("mousedown", stop, { capture: true });
    window.addEventListener("dblclick", stop, { capture: true });

    // 3) If something re-locks (e.g., ESC → click prompt), immediately unlock again
    const onLockChange = () => {
      if (gameOver && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };
    document.addEventListener("pointerlockchange", onLockChange);

    // Helper body class for optional CSS
    document.body.classList.add("game-over");

    return () => {
      window.removeEventListener("pointerdown", stop, { capture: true } as any);
      window.removeEventListener("mousedown", stop, { capture: true } as any);
      window.removeEventListener("dblclick", stop, { capture: true } as any);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.body.classList.remove("game-over");
    };
  }, [gameOver]);

  const replay = () => {
    // Easiest full reset of all pools/stores without touching main.tsx
    window.location.reload();
  };

  return (
    <div className="hud">
      {showCrosshair && !gameOver && (
        <div className="crosshair">
          <span className="h" />
          <span className="v" />
        </div>
      )}

      {/* LEFT bottom: Player Health + Score */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18 }}>
          Health: {playerHealth}/{maxHealth}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>
          Score: {score} <span style={{ opacity: 0.7, fontWeight: 500 }}>({kills} kills)</span>
        </div>
      </div>

      {/* RIGHT bottom: Ammo + enemy fire info */}
      <div className="ammo">
        <div className="line">
          Gun: {String(magazine).padStart(2, "0")} / {infinite ? "∞" : reserve}
        </div>
        <div className="sub">Mag size: {magazineSize}</div>
        <div className="sub" title="Damage per enemy bullet from config">
          Enemy bullet dmg: {config.enemyBullets.damage}
        </div>
        <div className="sub" title="Fire interval / mode">
          Fire: {config.enemies.fire.mode} · {config.enemies.fire.interval}s
        </div>
        <div className="hint" style={{ marginTop: 4, opacity: 0.85, fontSize: 12 }}>
          Press R to reload
        </div>
      </div>

      {reloading && !gameOver && <div className="reload">Reloading…</div>}

      {/* GAME OVER overlay (clickable) */}
      {gameOver && (
        <div
          className="gameover-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "default",
          }}
          // prevent any bubbling back to canvas / lock handlers
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              background: "rgba(20,20,24,0.95)",
              color: "#fff",
              padding: "24px 28px",
              borderRadius: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              minWidth: 280,
              textAlign: "center",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Game Over</div>
            <div style={{ fontSize: 16, opacity: 0.9, marginBottom: 16 }}>Score: {score}</div>
            <button
              onClick={replay}
              style={{
                background: "#4caf50",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Replay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useGunStore } from "../store/gunStore";
import { useEnemyStore } from "../store/enemyStore";

export default function HUD({ showCrosshair = true }: { showCrosshair?: boolean }) {
  const { magazine, reserve, magazineSize, infinite, reloading } = useGunStore();
  const score = useEnemyStore((s) => s.score); // ✅ points

  return (
    <div className="hud">
      {showCrosshair && (
        <div className="crosshair">
          <span className="h" />
          <span className="v" />
        </div>
      )}

      {/* ✅ SCORE — mirror of ammo panel, bottom-left */}
      <div
        className="score"
        style={{
          position: "absolute",
          bottom: 40,   // match ammo panel bottom
          left: 40,     // opposite of ammo's right: 40
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }}
      >
        Score: {score}
      </div>

      {/* Ammo panel (bottom-right) */}
      <div className="ammo">
        <div className="line">
          Gun: {String(magazine).padStart(2, "0")} / {infinite ? "∞" : reserve}
        </div>
        <div className="sub">Mag size: {magazineSize}</div>
        <div className="hint" style={{ marginTop: 4, opacity: 0.85, fontSize: 12 }}>
          Press R to reload
        </div>
      </div>

      {reloading && <div className="reload">Reloading…</div>}
    </div>
  );
}

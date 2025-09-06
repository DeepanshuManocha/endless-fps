// src/ui/HUD.tsx
import { useGunStore } from "../store/gunStore";

export default function HUD({ showCrosshair = true }: { showCrosshair?: boolean }) {
  const { magazine, reserve, magazineSize, infinite, reloading } = useGunStore();

  return (
    <div className="hud">
      {/* crosshair */}
      {showCrosshair && (
        <div className="crosshair">
          <span className="h" />
          <span className="v" />
        </div>
      )}

      {/* ammo bottom-right */}
      <div className="ammo">
        <div className="line">
          Gun: {String(magazine).padStart(2, "0")} / {infinite ? "∞" : reserve}
        </div>
        <div className="sub">Mag size: {magazineSize}</div>
      </div>

      {/* reload center-bottom */}
      {reloading && <div className="reload">Reloading…</div>}
    </div>
  );
}

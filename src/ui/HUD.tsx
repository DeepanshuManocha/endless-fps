import { useGunStore } from "../store/gunStore";

export default function HUD() {
  const { magazine, reserve, magazineSize, infinite, reloading } = useGunStore();

  return (
    <div className="hud">
      {/* crosshair */}
      <div className="crosshair">
        <span className="h" />
        <span className="v" />
      </div>

      {/* ammo bottom-right */}
      <div className="ammo">
        <div className="line">Gun: {String(magazine).padStart(2, "0")} / {infinite ? "∞" : reserve}</div>
        <div className="sub">Mag size: {magazineSize}</div>
      </div>

      {/* reload center-bottom */}
      {reloading && <div className="reload">Reloading…</div>}
    </div>
  );
}

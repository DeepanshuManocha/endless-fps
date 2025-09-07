// src/ui/LegendOverlay.tsx
import type { PointerEvent, ReactNode } from "react";
import { config } from "../config";

export default function LegendOverlay({ onLock }: { onLock: () => void }) {
  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onLock();
  };

  // Colors from config with safe fallbacks
  const healthColor =
    (config as any)?.healthPickups?.color ??
    (config as any)?.health?.color ??
    "#ff3b3b";
  const ammoColor =
    (config as any)?.pickups?.color ??
    "#ffd54f";
  const enemyColor =
    (config as any)?.enemies?.color ??
    "#ef5350";

  return (
    <button
      className="lock-overlay"
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      aria-label="Click to lock pointer and continue"
    >
      <div className="overlay-panel" aria-hidden>
        <div className="overlay-title">Know your pickups & foes</div>

        <ul className="legend">
          <LegendRow
            icon={<SquareIcon color={healthColor} />}
            tag="HEALTH"
            tagClass="tag-health"
            label="Health pickup"
            sub={`Restores ${config.healthPickups.healPerPickup} HP.`}
          />

          <LegendRow
            icon={<SquareIcon color={ammoColor} />}
            tag="AMMO"
            tagClass="tag-ammo"
            label="Bullet pickup"
            sub={`+${config.pickups.bulletsPerPickup} bullets per pickup.`}
          />

          <LegendRow
            icon={<Cylinder2DIcon color={enemyColor} />}
            tag="ENEMY"
            tagClass="tag-enemy"
            label="Enemy"
            sub={`Kill to earn ${config.score.perKill} point${
              config.score.perKill === 1 ? "" : "s"
            }.`}
          />
        </ul>

        <div className="overlay-footer">Click to lock in</div>
      </div>
    </button>
  );
}

function LegendRow({
  icon,
  tag,
  tagClass,
  label,
  sub,
}: {
  icon: ReactNode;
  tag: string;
  tagClass: string;
  label: string;
  sub: string;
}) {
  return (
    <li className="legend-row">
      <div className="icon-wrap">{icon}</div>
      <div className="legend-text">
        <div className={`tag ${tagClass}`}>{tag}</div>
        <div className="label">{label}</div>
        <div className="sub">{sub}</div>
      </div>
    </li>
  );
}

/** Flat, smaller square (used to represent cube pickups) */
function SquareIcon({ color }: { color: string }) {
  const stroke = outlineColor(color);
  return (
    <svg className="icon" viewBox="0 0 120 90" role="img" aria-label="square">
      <rect
        x="24"
        y="20"
        width="72"
        height="50"
        rx="6"
        fill={color}
        stroke={stroke}
        strokeWidth="3"
      />
    </svg>
  );
}

/** Flat, “normal” cylinder: ellipse + rect + ellipse with consistent outline */
function Cylinder2DIcon({ color }: { color: string }) {
  const stroke = outlineColor(color);
  return (
    <svg className="icon" viewBox="0 0 120 90" role="img" aria-label="cylinder">
      <g
        stroke={stroke}
        strokeWidth="3"
        fill={color}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* top ellipse */}
        <ellipse cx="60" cy="28" rx="30" ry="10" />
        {/* body */}
        <rect x="30" y="28" width="60" height="34" />
        {/* bottom ellipse */}
        <ellipse cx="60" cy="62" rx="30" ry="10" />
      </g>
    </svg>
  );
}

/* --- tiny helpers for a readable outline color --- */
function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m.length === 3 ? m.split("").map(c => c + c).join("") : m, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function shade(hex: string, amt = 0.35) {
  const { r, g, b } = hexToRgb(hex);
  const a = clamp01(amt);
  return `rgb(${Math.round(r * (1 - a))}, ${Math.round(g * (1 - a))}, ${Math.round(
    b * (1 - a)
  )})`;
}
function outlineColor(fill: string) {
  // Slightly darker outline so flat shapes still read well
  return shade(fill, 0.45);
}

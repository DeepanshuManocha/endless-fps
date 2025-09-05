import type { Triplet } from "@react-three/cannon";

// simple clamp
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// --- raw config you can edit freely
const raw = {
  physics: { gravity: [0, -9.81, 0] as Triplet },
  ground: { width: 30, depth: 60, height: 0.5, color: "#2e7d32" },
 player: {
    mass: 12,
    speed: 50,
    color: "#2196f3",
    linearDamping: 0.9,
    angularDamping: 1.0,
    cameraHeightRatio: 0.6, // fraction of body height
    camBack: 2.5,           // third-person distance
    camUp: 0.6,             // extra upward offset
  },
  walls: { height: 1.2, thickness: 0.3, color: "#444" },
};

const rawGun = {
  magazineSize: 8,         // bullets per mag (one round)
  totalBullets: 32,        // reserve pool at start
  fireMode: "semi" as "auto" | "semi", // auto = hold to spray; semi = one per click
  fireRate: 8,             // bullets per second (used only in auto)
  reloadTime: 1.2,         // time to reload
  ignoreReload: true,     // if true, instant auto-refill when empty (if reserve > 0 or infinite)
  infiniteBullets: false,  // if true, show ∞ and never run out
  bulletSpeed: 30,         // m/s
  poolSize: 64,            // pooled bullets (max concurrent in-flight)
};


// --- sanitized config with min/max per parameter
export const config = {
  physics: {
    gravity: raw.physics.gravity,
  },
  ground: {
    width: clamp(raw.ground.width, 10, 200),
    depth: clamp(raw.ground.depth, 10, 200),
    height: clamp(raw.ground.height, 0.1, 5),
    color: raw.ground.color,
  },
  player: {
    mass: clamp(raw.player.mass, 1, 100),
    speed: clamp(raw.player.speed, 1, 25),
    color: raw.player.color,
    linearDamping: clamp(raw.player.linearDamping, 0, 1),
    angularDamping: clamp(raw.player.angularDamping, 0, 1),
    cameraHeightRatio: clamp(raw.player.cameraHeightRatio, 0.3, 0.9),
    camBack: clamp(raw.player.camBack, 0, 10),
    camUp: clamp(raw.player.camUp, 0, 3),
  },
  walls: {
    height: clamp(raw.walls.height, 0.5, 5),
    thickness: clamp(raw.walls.thickness, 0.1, 2),
    color: raw.walls.color,
  }, 
  gun: {
    magazineSize: clamp(rawGun.magazineSize, 1, 100),
    totalBullets: clamp(rawGun.totalBullets, 0, 9999),
    fireMode: rawGun.fireMode,
    fireRate: clamp(rawGun.fireRate, 1, 50),
    reloadTime: clamp(rawGun.reloadTime, 0, 10),
    ignoreReload: !!rawGun.ignoreReload,
    infiniteBullets: !!rawGun.infiniteBullets,
    bulletSpeed: clamp(rawGun.bulletSpeed, 5, 200),
    poolSize: clamp(rawGun.poolSize, 8, 512),
  },
} as const;

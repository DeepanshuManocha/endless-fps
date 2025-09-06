import type { Triplet } from "@react-three/cannon";

// simple clamp
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// --- raw config you can edit freely
const raw = {
  physics: { gravity: [0, -9.81, 0] as Triplet },

  ground: { width: 30, depth: 30, height: 0.5, color: "#2e7d32" },

  player: {
    mass: 12,
    speed: 50,
    color: "#2196f3",
    linearDamping: 0.9,
    angularDamping: 1.0,
    cameraHeightRatio: 0.6, // fraction of body height
    healthMax: 100,       
    height: 1.8,          
    hitRadius: 10,
  },

  walls: {
    height: 4,
    thickness: 0.5,
    color: "#455a64",
  },

  gun: {
    // ammo
    magazineSize: 12,
    totalBullets: 120,
    infiniteBullets: false,
    ignoreReload: false,
    reloadTime: 1.2,

    // fire
    fireMode: "auto" as "auto" | "semi",
    fireRate: 8, // bullets per sec
    bulletSpeed: 80,
    poolSize: 128,
    damage: 100, // ✅ damage per bullet ray hit
  },

  enemies: {
    poolSize: 24,
    color: "#e53935",
    health: 100,           // ✅ base HP
    mass: 8,
    speed: 20,             // movement speed
    linearDamping: 0.92,
    angularDamping: 1.0,
    stopDistance: 6.0,     // ✅ how close to the player they stop
    separationRadius: 2.0, // ✅ distance to keep from each other
    sepStrength: 6.0,      // steering push to separate

    // physics collision filters (avoid enemy-enemy collisions)
    collision: {
      group: 0x0002,
      // collide with default world (0x0001) and bullets (0x0004). Change if needed.
      mask: 0x0001 | 0x0004,
    },
    fire: {               // ✅ NEW: enemy fire control
      mode: "single",      // "single" | "burst"
      interval: 2.5,      // seconds between attacks
      burstCount: 3,      // if mode = "burst"
      burstGap: 0.15,     // seconds between shots in a burst
    },
  },
   enemyBullets: {         // ✅ NEW: enemy bullet config
    poolSize: 200,
    speed: 35,
    damage: 15,           // how much health the player loses per hit
    radius: 0.08,
    ttl: 4.0,
    color: "#ff9100",
  },

  spaceship: {
    color: "#9e9e9e",
    // If ground is 10x10, ship becomes ~8x8. So 0.8 of min dimension.
    sizeRatio: 0.8,            // ✅ diameter as a ratio of smaller ground dimension
    thickness: 0.3,            // visual thickness
    heightAboveGround: 15,      // how high it floats above ground top
    dropInterval: 3.0,         // ✅ seconds between automatic drops
    maxSimultaneous: 2,        // cap active enemies at once (auto-drop respects this)
  },

  score: {
    perKill: 1,   // points awarded for each enemy kill
  },

   pickups: {
    poolSize: 64,          // how many cubes in the pool
    perKillDrops: 1,       // how many cubes to spawn per enemy kill
    bulletsPerPickup: 3,   // how many bullets you get per cube
    size: 0.2,             // cube edge size (visual)
    color: "#ffd54f",
    lifetime: 3,          // seconds before a cube auto-despawns
    collectRadius: 1.2,    // player proximity to collect
    spawnImpulse: 2.5,     // upward impulse
    spawnSpread: 0.6,      // random lateral speed
  },
  healthPickups: {
    poolSize: 32,         // how many heart cubes
    perKillDrops: 0,      // how many hearts to drop per enemy kill (0 = off)
    healPerPickup: 20,    // HP restored per pickup
    size: 0.22,
    color: "#e91e63",
    lifetime: 25,         // seconds before despawn
    collectRadius: 1.2,   // pickup distance
    spawnImpulse: 2.2,
    spawnSpread: 0.5,
  },
  loot: {
  dropCount: 0.7,     // how many pickups per kill
  ammoChance: 1,  // 70% chance a drop is ammo; otherwise it's a heart
},
};

// --- validated / clamped config exposed to game
const rawGun = raw.gun;
const rawEnemies = raw.enemies;
const rawWalls = raw.walls;
const rawGround = raw.ground;
const rawPlayer = raw.player;
const rawShip = raw.spaceship;
const rawScore = raw.score;
const rawPickups = raw.pickups;
const rawHealth = raw.healthPickups;
const rawLoot = raw.loot;

export const config = {
  physics: {
    gravity: raw.physics.gravity as Triplet,
  },

  ground: {
    width: clamp(rawGround.width, 6, 200),
    depth: clamp(rawGround.depth, 6, 200),
    height: clamp(rawGround.height, 0.1, 5),
    color: rawGround.color,
  },

  player: {
    mass: clamp(rawPlayer.mass, 1, 200),
    speed: clamp(rawPlayer.speed, 1, 200),
    color: rawPlayer.color,
    linearDamping: clamp(rawPlayer.linearDamping, 0, 1),
    angularDamping: clamp(rawPlayer.angularDamping, 0, 1),
    cameraHeightRatio: clamp(rawPlayer.cameraHeightRatio, 0.1, 0.95),
    healthMax: clamp(rawPlayer.healthMax, 1, 10000),
    height: clamp(rawPlayer.height, 0.5, 3),
    hitRadius: clamp(rawPlayer.hitRadius, 0.1, 2),
  },

  walls: {
    height: clamp(rawWalls.height, 1, 20),
    thickness: clamp(rawWalls.thickness, 0.1, 5),
    color: rawWalls.color,
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
    damage: clamp(rawGun.damage, 1, 500),
  },

  enemies: {
    poolSize: clamp(rawEnemies.poolSize, 1, 512),
    color: rawEnemies.color,
    health: clamp(rawEnemies.health, 1, 10000),
    mass: clamp(rawEnemies.mass, 1, 200),
    speed: clamp(rawEnemies.speed, 1, 100),
    linearDamping: clamp(rawEnemies.linearDamping, 0, 1),
    angularDamping: clamp(rawEnemies.angularDamping, 0, 1),

    stopDistance: clamp(rawEnemies.stopDistance, 0.1, 20),
    separationRadius: clamp(rawEnemies.separationRadius, 0.5, 10),
    sepStrength: clamp(rawEnemies.sepStrength, 0, 50),

    collision: {
      group: rawEnemies.collision.group | 0, // ensure number
      mask: rawEnemies.collision.mask | 0,
    },
    fire: {
      mode: rawEnemies.fire.mode as "single" | "burst",
      interval: clamp(rawEnemies.fire.interval, 0.1, 30),
      burstCount: clamp(rawEnemies.fire.burstCount ?? 1, 1, 20),
      burstGap: clamp(rawEnemies.fire.burstGap ?? 0.1, 0.05, 2),
    },
  },

   enemyBullets: {
    poolSize: clamp(raw.enemyBullets.poolSize, 1, 1000),
    speed: clamp(raw.enemyBullets.speed, 1, 200),
    damage: clamp(raw.enemyBullets.damage, 1, 10000),
    radius: clamp(raw.enemyBullets.radius, 0.02, 1),
    ttl: clamp(raw.enemyBullets.ttl, 0.2, 30),
    color: raw.enemyBullets.color,
  },

  spaceship: {
    color: rawShip.color,
    sizeRatio: clamp(rawShip.sizeRatio, 0.1, 1.0),
    thickness: clamp(rawShip.thickness, 0.05, 5),
    heightAboveGround: clamp(rawShip.heightAboveGround, 1, 100),
    dropInterval: clamp(rawShip.dropInterval, 0.1, 60),
    maxSimultaneous: clamp(rawShip.maxSimultaneous, 1, 10),
  },

  score: {
    perKill: clamp(rawScore.perKill, 1, 10),
  },

  pickups: {
    poolSize: clamp(rawPickups.poolSize, 1, 512),
    perKillDrops: clamp(rawPickups.perKillDrops, 0, 16),
    bulletsPerPickup: clamp(rawPickups.bulletsPerPickup, 0, 9999),
    size: clamp(rawPickups.size, 0.05, 2),
    color: rawPickups.color,
    lifetime: clamp(rawPickups.lifetime, 1, 300),
    collectRadius: clamp(rawPickups.collectRadius, 0.2, 5),
    spawnImpulse: clamp(rawPickups.spawnImpulse, 0, 50),
    spawnSpread: clamp(rawPickups.spawnSpread, 0, 10),
  },
  healthPickups: {
    poolSize: clamp(rawHealth.poolSize, 1, 512),
    perKillDrops: clamp(rawHealth.perKillDrops, 0, 16),
    healPerPickup: clamp(rawHealth.healPerPickup, 1, 10000),
    size: clamp(rawHealth.size, 0.05, 2),
    color: rawHealth.color,
    lifetime: clamp(rawHealth.lifetime, 1, 300),
    collectRadius: clamp(rawHealth.collectRadius, 0.2, 5),
    spawnImpulse: clamp(rawHealth.spawnImpulse, 0, 50),
    spawnSpread: clamp(rawHealth.spawnSpread, 0, 10),
  },
   loot: {
    dropCount: clamp(rawLoot.dropCount, 0, 10),
    ammoChance: Math.max(0, Math.min(1, rawLoot.ammoChance ?? 0.7)),
  },

} as const;

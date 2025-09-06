# FPS Endless Shooter

A tiny first-person arena built with **React + Vite + TypeScript**, **three / @react-three/fiber**, and **cannon-es**.  
Survive waves of enemies dropped by a hovering spaceship, collect ammo & health pickups, and chase a high score.

---

## 🎮 What is what (object legend)

- **Blue cylinder** — **Player**
- **Grey cylinder (thin, above ground)** — **Spaceship** (spawner)
- **Red cylinders** — **Enemies**
- **Small light-grey spheres** — **Your bullets**
- **Small orange spheres** — **Enemy bullets**
- **Yellow cubes** — **Ammo (bullet) pickups** → adds to **total bullets / reserve**
- **Red cubes** — **Health pickups (hearts)** → heals the player (up to max HP)
- **Green plane** — Ground
- **Dark grey walls** — Arena boundaries

---

## ✨ Features

- **Config-first gameplay** — All tuning in `config.ts` (player, gun, enemies, spaceship, scoring, pickups, camera shake, etc.).
- **Object pooling everywhere** — Player bullets, enemy bullets, enemies, ammo & health pickups.
- **Spaceship spawner** — Drops enemies on a timer and on kills; respects a `maxSimultaneous` cap.
- **Enemies**
  - Land first, **then** chase the player.
  - Maintain spacing via simple separation steering (no clumping/collisions).
  - **Shooter AI**: single or **burst** fire with interval/gap controls.
- **Player combat**
  - Gun supports **auto** and **semi** modes, fire rate, reloads, magazine/reserve, and damage.
  - Hitscan feel via raycast damage + pooled physics bullets for visuals.
- **Pickups**
  - **Ammo (yellow)** → increases **reserve** (not the current magazine).
  - **Health (red)** → heals up to `player.healthMax` (default 100).
  - **Loot system**: choose number of drops per kill and the chance of ammo vs health.
- **HUD**
  - Bottom-left: **Health** and **Score** (score-per-kill is configurable).
  - Bottom-right: **Gun: mag / reserve**, **Mag size**, **Enemy bullet dmg**, fire mode/interval, and **“Press R to reload”**.
  - Crosshair + “Reloading…” indicator.
- **Game Over**
  - Player takes damage from enemy bullets; at 0 HP the game **freezes**, pointer-lock **unlocks**, and a **Game Over** popup shows **Score** + **Replay**.
- **Camera feel**
  - Subtle **movement bob** while walking.
  - **Kick** when firing; **hit-shake** when taking damage.
  - Camera shake offsets only the **camera**, not the player physics.

---

## ⚙️ Key config knobs (`src/config.ts`)

> All values are clamped to sane ranges to avoid breaking the sim.

- **ground / walls** — sizes, colors.
- **player**
  - `speed`, `mass`, `linearDamping`, `cameraHeightRatio`
  - `healthMax`, `hitRadius`, `height`
- **gun**
  - `magazineSize`, `totalBullets`, `infiniteBullets`, `ignoreReload`, `reloadTime`
  - `fireMode: "auto" | "semi"`, `fireRate`, `bulletSpeed`, `damage`, `poolSize`
- **enemies**
  - `poolSize`, `health`, `speed`, `stopDistance`, `separationRadius`, `sepStrength`
  - `fire: { mode: "single" | "burst", interval, burstCount, burstGap }`
- **spaceship**
  - `sizeRatio`, `thickness`, `heightAboveGround`, `dropInterval`, `maxSimultaneous`
- **score**
  - `perKill` — points per enemy kill
- **pickups (ammo)**
  - `poolSize`, `bulletsPerPickup`, `lifetime`, `collectRadius`, `spawnImpulse`, `spawnSpread`
- **healthPickups (hearts)**
  - `poolSize`, `healPerPickup`, `lifetime`, `collectRadius`, `spawnImpulse`, `spawnSpread`
- **loot**
  - `dropCount` — how many pickups per kill
  - `ammoChance` — chance each drop is ammo (else heart)
- **enemyBullets**
  - `poolSize`, `speed`, `damage`, `radius`, `ttl`, `color`
- **cameraShake**
  - `moveAmplitude`, `moveFrequency`, `noiseAmplitude`, `kickAmplitude`, `hitAmplitude`, `decay`, `maxTilt`

---

## 🎯 Controls

- **W A S D** — move
- **Mouse** — look (click the canvas to lock pointer)
- **Left click** — fire
- **R** — reload
- Pointer lock auto-releases on **Game Over**; **Replay** reloads the page and resets everything.

---

## 🧠 Design decisions (short)

- **Pooling > spawning** for consistent FPS and no GC spikes.
- **Landing gate** so enemies don’t chase mid-air.
- **Separation steering** for enemy spacing instead of heavyweight pathfinding.
- **Event-driven effects** (score, spawns, camera shake) to keep systems decoupled.
- **Pointer-lock ergonomics** — forced unlock + re-lock blocking on Game Over for a clean UI.
- **Config-first** — one place to tune gameplay (`config.ts`) with safety clamps.

---

## 🚀 Install & run

> Requires Node 18+.

```bash
# Install deps
npm install

# Dev server
npm run dev
# open the localhost URL shown in your terminal (usually http://localhost:5173)

# Production build
npm run build

# Preview production build
npm run preview
```

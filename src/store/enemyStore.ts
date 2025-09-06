import { create } from "zustand";
import type { Object3D } from "three";
import { config } from "../config"; // ✅

export type EnemyHandle = {
  index: number;
  activate: (pos: [number, number, number]) => void;
  damage: (amount: number) => boolean;
  deactivate: () => void;
  getObject3D: () => Object3D | null;
  isActive: () => boolean;
};

type Listener = (index: number) => void;

type EnemyStore = {
  handles: (EnemyHandle | null)[];

  // counts
  kills: number;
  score: number;                 // ✅ total points
  resetKills: () => void;
  resetScore: () => void;        // ✅ optional helper

  register: (index: number, handle: EnemyHandle) => void;
  unregister: (index: number) => void;

  spawnAt: (pos: [number, number, number]) => boolean;
  aliveCount: () => number;

  hitByObject: (obj: Object3D, damage: number) => boolean;

  onKilled: (fn: Listener) => () => void;
  _killedListeners: Set<Listener>;
  _emitKilled: (index: number) => void;
};

export const useEnemyStore = create<EnemyStore>((set, get) => ({
  handles: [],

  kills: 0,
  score: 0,                               // ✅
  resetKills: () => set({ kills: 0 }),
  resetScore: () => set({ score: 0 }),    // ✅

  register: (index, handle) => {
    const handles = get().handles.slice();
    handles[index] = handle;
    set({ handles });
  },
  unregister: (index) => {
    const handles = get().handles.slice();
    handles[index] = null;
    set({ handles });
  },

  spawnAt: (pos) => {
    const { handles } = get();
    for (let i = 0; i < handles.length; i++) {
      const h = handles[i];
      if (h && !h.isActive()) {
        h.activate(pos);
        return true;
      }
    }
    return false;
  },

  aliveCount: () => {
    const { handles } = get();
    let n = 0;
    for (const h of handles) if (h && h.isActive()) n++;
    return n;
  },

  hitByObject: (obj, damage) => {
  let cur: Object3D | null = obj;
  while (cur) {
    // @ts-ignore
    const idx = (cur.userData?.enemyIndex ?? cur.userData?.enemyId) as number | undefined;
    if (typeof idx === "number") {
      const h = get().handles[idx];
      if (h) {
        h.damage(damage);     // the enemy decides & emits once if it dies
        return true;
      }
    }
    cur = cur.parent!;
  }
  return false;
},


  onKilled: (fn) => {
    const st = get();
    st._killedListeners.add(fn);
    return () =>
      set((state) => {
        const s = new Set(state._killedListeners);
        s.delete(fn);
        return { _killedListeners: s };
      });
  },

  _killedListeners: new Set<Listener>(),

  _emitKilled: (index) => {
    // ✅ bump kills and add points from config
    set((s) => ({
      kills: s.kills + 1,
      score: s.score + config.score.perKill,
    }));
    for (const fn of get()._killedListeners) {
      try { fn(index); } catch {}
    }
  },
}));

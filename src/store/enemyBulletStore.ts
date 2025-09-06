// src/store/enemyBulletStore.ts
import { create } from "zustand";

export type EnemyBulletHandle = {
  index: number;
  activate: (origin: [number, number, number], dir: [number, number, number]) => void;
  deactivate: () => void;
  isActive: () => boolean;
};

type Store = {
  handles: (EnemyBulletHandle | null)[];
  register: (i: number, h: EnemyBulletHandle) => void;
  unregister: (i: number) => void;
  spawn: (origin: [number, number, number], dir: [number, number, number]) => boolean;
};

export const useEnemyBulletStore = create<Store>((set, get) => ({
  handles: [],
  register: (i, h) => {
    const handles = get().handles.slice();
    handles[i] = h;
    set({ handles });
  },
  unregister: (i) => {
    const handles = get().handles.slice();
    handles[i] = null;
    set({ handles });
  },
  spawn: (origin, dir) => {
    for (const h of get().handles) {
      if (h && !h.isActive()) {
        h.activate(origin, dir);
        return true;
      }
    }
    return false;
  },
}));

// src/store/healthPickupStore.ts
import { create } from "zustand";

export type HealthPickupHandle = {
  index: number;
  activate: (pos: [number, number, number]) => void;
  deactivate: () => void;
  isActive: () => boolean;
};

type Store = {
  handles: (HealthPickupHandle | null)[];
  register: (i: number, h: HealthPickupHandle) => void;
  unregister: (i: number) => void;
  spawnAt: (pos: [number, number, number]) => boolean;
};

export const useHealthPickupStore = create<Store>((set, get) => ({
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
  spawnAt: (pos) => {
    for (const h of get().handles) {
      if (h && !h.isActive()) {
        h.activate(pos);
        return true;
      }
    }
    return false;
  },
}));

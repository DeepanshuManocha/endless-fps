import { create } from "zustand";

export type PickupHandle = {
  index: number;
  activate: (pos: [number, number, number]) => void;
  deactivate: () => void;
  isActive: () => boolean;
};

type Store = {
  handles: (PickupHandle | null)[];
  register: (index: number, h: PickupHandle) => void;
  unregister: (index: number) => void;

  spawnAt: (pos: [number, number, number]) => boolean; // returns true if spawned
};

export const useAmmoPickupStore = create<Store>((set, get) => ({
  handles: [],

  register: (index, h) => {
    const handles = get().handles.slice();
    handles[index] = h;
    set({ handles });
  },
  unregister: (index) => {
    const handles = get().handles.slice();
    handles[index] = null;
    set({ handles });
  },

  spawnAt: (pos) => {
    const { handles } = get();
    for (const h of handles) {
      if (h && !h.isActive()) {
        h.activate(pos);
        return true;
      }
    }
    return false;
  },
}));

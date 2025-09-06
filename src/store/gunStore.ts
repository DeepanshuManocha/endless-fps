import { create } from "zustand";

type HUDState = {
  magazine: number;
  reserve: number;
  magazineSize: number;
  infinite: boolean;
  reloading: boolean;
  reloadEta: number;
  set: (patch: Partial<HUDState>) => void;
};

export const useGunStore = create<HUDState>((set) => ({
  magazine: 0,
  reserve: 0,
  magazineSize: 0,
  infinite: false,
  reloading: false,
  reloadEta: 0,
  set: (patch) => set(patch),
}));

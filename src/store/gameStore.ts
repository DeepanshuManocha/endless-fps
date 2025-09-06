// src/store/gameStore.ts
import { create } from "zustand";
import { config } from "../config";

type GameStore = {
  playerHealth: number;
  maxHealth: number;
  gameOver: boolean;

  resetPlayer: () => void;
  damagePlayer: (amount: number) => void;
  revive: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  maxHealth: config.player.healthMax,
  playerHealth: config.player.healthMax,
  gameOver: false,

  resetPlayer: () =>
    set({ playerHealth: get().maxHealth, gameOver: false }),

  damagePlayer: (amount) => {
    const nh = Math.max(0, get().playerHealth - amount);
    const over = nh <= 0;
    set({ playerHealth: nh, gameOver: over });
  },

  revive: () => set({ playerHealth: get().maxHealth, gameOver: false }),
}));

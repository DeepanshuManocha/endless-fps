// src/store/gameStore.ts
import { create } from "zustand";
import { config } from "../config";

type GameStore = {
  playerHealth: number;
  maxHealth: number;
  gameOver: boolean;

  resetPlayer: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;  // ✅ add
  revive: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  maxHealth: config.player.healthMax,
  playerHealth: config.player.healthMax,
  gameOver: false,

  resetPlayer: () => set({ playerHealth: get().maxHealth, gameOver: false }),

  damagePlayer: (amount) => {
    const nh = Math.max(0, get().playerHealth - amount);
    set({ playerHealth: nh, gameOver: nh <= 0 });
  },

  // ✅ clamp to maxHealth (100 by default)
  healPlayer: (amount) => {
    const nh = Math.min(get().maxHealth, get().playerHealth + Math.max(0, amount));
    set({ playerHealth: nh });
  },

  revive: () => set({ playerHealth: get().maxHealth, gameOver: false }),
}));

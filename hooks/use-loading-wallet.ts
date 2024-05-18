import { create } from "zustand";

interface ILoadingWallet {
  isLoading: boolean;
  setLoading: () => void;
  unsetLoading: () => void;
}

export const useLoadingWallet = create<ILoadingWallet>((set) => ({
  isLoading: false,
  setLoading: () => set({ isLoading: true }),
  unsetLoading: () => set({ isLoading: false }),
}));

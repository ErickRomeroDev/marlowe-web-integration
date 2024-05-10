import { create } from "zustand";
import { BroswerWalletExtension, SupportedWalletName } from "@marlowe.io/wallet/browser";
import { walletsSupported } from "@/constants/wallets-supported";
import { WalletAPI } from "@marlowe.io/wallet";

interface CardanoState {
  walletExtensions: BroswerWalletExtension[] | undefined;
  message: string;
  walletApi: WalletAPI | undefined;
  walletName: SupportedWalletName | undefined;
  walletAddress: string | undefined;
  setWalletExtensions: (wallets: BroswerWalletExtension[] | undefined) => void;
  setMessage: (message: string) => void;
  setWalletApi: (walletAPi: WalletAPI) => void;
  setWalletName: (walletName: SupportedWalletName) => void;
  setWalletAddress: (walletAddress: string) => void;
  loadWallets: () => Promise<void>;
  loadWalletApi: (walletName: SupportedWalletName) => Promise<void>;
}

export const useCardanoStore = create<CardanoState>((set, get) => ({
  walletExtensions: undefined,
  message: "Loading wallets...",
  walletApi: undefined,
  walletName: undefined,
  walletAddress: undefined,

  setWalletExtensions: (wallets) => set({ walletExtensions: wallets }),
  setMessage: (message) => set({ message }),
  setWalletApi: (walletApi) => set({ walletApi }),
  setWalletName: (walletName) => set({ walletName }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),

  loadWallets: async () => {
    try {
      const { getInstalledWalletExtensions } = await import("@marlowe.io/wallet");
      const installedWalletExtensions = getInstalledWalletExtensions().filter((item) => walletsSupported.includes(item.name.toLowerCase()));
      get().setWalletExtensions(installedWalletExtensions);
      get().setMessage("Wallets loaded successfully!");
    } catch (error) {
      console.error("Failed to load wallets:", error);
      get().setMessage("Failed to load wallets.");
    }
  },

  loadWalletApi: async (walletName) => {
    try {
      const { mkBrowserWallet } = await import("@marlowe.io/wallet");
      const walletApi = await mkBrowserWallet(walletName);
      const walletAddress = await walletApi.getUsedAddresses();
      if (walletAddress !== undefined) {
        window.localStorage.setItem(
          "walletInfo",
          JSON.stringify({
            address: walletAddress[0],
            walletProvider: walletName,
          })
        );
      }
      get().setWalletApi(walletApi);
      get().setWalletName(walletName);
      get().setWalletAddress(walletAddress[0]);
    } catch (error) {
      console.error("Failed to get Wallet API:", error);
    }
  },
}));

import { create } from "zustand";
import { BroswerWalletExtension, SupportedWalletName } from "@marlowe.io/wallet/browser";
import { walletsSupported } from "@/constants/wallets-supported";
import { WalletAPI } from "@marlowe.io/wallet";
import { createCookie } from "@/actions/set-cookies";
import { deleteCookie } from "@/actions/delete-cookies";

interface CardanoState {
  walletExtensions: BroswerWalletExtension[] | undefined;
  message: string;
  walletApi: WalletAPI | undefined;
  walletName: SupportedWalletName | undefined;
  walletAddress: string | undefined;
  network: string | undefined;
  balance: number | undefined;
  setWalletExtensions: (wallets: BroswerWalletExtension[] | undefined) => void;
  setMessage: (message: string) => void;
  setWalletApi: (walletAPi: WalletAPI | undefined) => void;
  setWalletName: (walletName: SupportedWalletName | undefined) => void;
  setWalletAddress: (walletAddress: string | undefined) => void;
  setNetwork: (network: string | undefined) => void;
  setBalance: (balance: number | undefined) => void;
  loadWalletsExtensions: () => Promise<void>;
  connectWallet: (walletName: SupportedWalletName) => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export const useCardanoStore = create<CardanoState>((set, get) => ({
  walletExtensions: undefined,
  message: "Loading wallets...",
  walletApi: undefined,
  walletName: undefined,
  walletAddress: undefined,
  network: undefined,
  balance: undefined,

  setWalletExtensions: (wallets) => set({ walletExtensions: wallets }),
  setMessage: (message) => set({ message }),
  setWalletApi: (walletApi) => set({ walletApi }),
  setWalletName: (walletName) => set({ walletName }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setNetwork: (network) => set({ network }),
  setBalance: (balance) => set({ balance }),

  loadWalletsExtensions: async () => {
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

  connectWallet: async (walletName) => {
    try {
      const { mkBrowserWallet } = await import("@marlowe.io/wallet");
      const walletApi = await mkBrowserWallet(walletName);
      const walletAddress = await walletApi.getUsedAddresses();
      const network = await walletApi.isMainnet().then((result) => (result ? "mainnet" : "testnet"));
      const balance = await walletApi.getLovelaces().then((balance) => Number(balance) / 1000000);
      if (walletAddress !== undefined) {
        window.localStorage.setItem(
          "walletInfo",
          JSON.stringify({
            address: walletAddress[0],
            walletName: walletName.toLowerCase(),
            network,
            balance: Math.floor(balance).toString(),            
          })
        );
        createCookie(JSON.stringify({
          address: walletAddress[0],
          walletName: walletName.toLowerCase(),
          network,
          balance: Math.floor(balance).toString(),            
        }));
      }
      get().setWalletApi(walletApi);
      get().setWalletName(walletName);
      get().setWalletAddress(walletAddress[0]);
      get().setNetwork(network);
      get().setBalance(balance);
    } catch (error) {
      console.error("Failed to get Wallet API:", error);
    }
  },

  disconnectWallet: async () => {
    try {
      window.localStorage.removeItem("walletInfo");
      deleteCookie();

      get().setWalletApi(undefined);
      get().setWalletName(undefined);
      get().setWalletAddress(undefined);
      get().setNetwork(undefined);
      get().setBalance(undefined);
    } catch (error) {
      console.error("Failed to get Wallet API:", error);
    }
  },
}));

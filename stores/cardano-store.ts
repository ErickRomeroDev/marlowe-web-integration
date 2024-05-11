import { create } from "zustand";
import { BroswerWalletExtension, SupportedWalletName } from "@marlowe.io/wallet/browser";
import { walletsSupported } from "@/constants/wallets-supported";
import { WalletAPI } from "@marlowe.io/wallet";
import { createCookie } from "@/actions/set-cookies";
import { deleteCookie } from "@/actions/delete-cookies";
import { IWalletInStorage } from "@/constants";

interface CardanoState {
  walletExtensions: BroswerWalletExtension[] | undefined;  
  walletApi: WalletAPI | undefined;
  walletName: SupportedWalletName | undefined;
  walletAddress: string | undefined;
  network: string | undefined;
  balance: number | undefined;
  setWalletExtensions: (wallets: BroswerWalletExtension[] | undefined) => void;  
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
  walletApi: undefined,
  walletName: undefined,
  walletAddress: undefined,
  network: undefined,
  balance: undefined,

  setWalletExtensions: (wallets) => set({ walletExtensions: wallets }),  
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
    } catch (error) {
      console.error("Failed to load wallets:", error);      
    }
  },

  connectWallet: async (walletName) => {
    try {
      const { mkBrowserWallet } = await import("@marlowe.io/wallet");
      const walletApi = await mkBrowserWallet(walletName);
      const walletAddress = await walletApi.getUsedAddresses();
      const network = await walletApi.isMainnet().then((result) => (result ? "mainnet" : "testnet"));
      const balance = await walletApi.getLovelaces().then((balance) => Number(balance) / 1000000);
      const walletStorage: IWalletInStorage = {
        address: walletAddress[0],
        walletName: walletName.toLowerCase(),
        network,
        balance: Math.floor(balance).toString(),            
      }
      if (walletAddress !== undefined) {
        window.localStorage.setItem(
          "walletInfo",
          JSON.stringify(walletStorage)
        );
        createCookie(JSON.stringify(walletStorage));
      }
      get().setWalletApi(walletApi);
      get().setWalletName(walletName);
      get().setWalletAddress(walletAddress[0]);
      get().setNetwork(network);
      get().setBalance(balance);
    } catch (error) {
      console.error("Failed to get Wallet API:");
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

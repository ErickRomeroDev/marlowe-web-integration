import { create } from "zustand";
import { BroswerWalletExtension, SupportedWalletName } from "@marlowe.io/wallet/browser";
import { walletsSupported } from "@/constants/wallets-supported";
import { WalletAPI } from "@marlowe.io/wallet";
import { createCookie } from "@/actions/set-cookies";
import { deleteCookie } from "@/actions/delete-cookies";
import { IWalletInStorage } from "@/constants";
import { RestClient } from "@marlowe.io/runtime-rest-client";
import { RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";

interface CardanoState {
  walletExtensions: BroswerWalletExtension[] | undefined;
  walletExtensionSelected: BroswerWalletExtension | undefined;
  walletApi: WalletAPI | undefined;
  walletName: SupportedWalletName | undefined;
  walletAddress: string | undefined;
  network: string | undefined;
  balance: number | undefined;
  // runtimeLifecycle: RuntimeLifecycle | undefined;
  // restAPI: RestClient | undefined;
  setWalletExtensions: (wallets: BroswerWalletExtension[] | undefined) => void;
  setWalletExtensionSelected: (wallet: BroswerWalletExtension | undefined) => void;
  setWalletApi: (walletAPi: WalletAPI | undefined) => void;
  setWalletName: (walletName: SupportedWalletName | undefined) => void;
  setWalletAddress: (walletAddress: string | undefined) => void;
  setNetwork: (network: string | undefined) => void;
  setBalance: (balance: number | undefined) => void;
  // setRuntimeLifecycle: (runtimeLifecycle: RuntimeLifecycle | undefined) => void;
  // setRestAPI: (restAPI: RestClient | undefined) => void;
  loadWalletsExtensions: () => Promise<void>;
  connectWallet: (walletName: SupportedWalletName) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useCardanoStore = create<CardanoState>((set, get) => ({
  walletExtensions: undefined,
  walletExtensionSelected: undefined,
  walletApi: undefined,
  walletName: undefined,
  walletAddress: undefined,
  network: undefined,
  balance: undefined,
  // runtimeLifecycle: undefined,
  // restAPI: undefined,
  isOpen: false,
  

  setWalletExtensions: (wallets) => set({ walletExtensions: wallets }),
  setWalletExtensionSelected: (wallet) => set({ walletExtensionSelected: wallet }),
  setWalletApi: (walletApi) => set({ walletApi }),
  setWalletName: (walletName) => set({ walletName }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setNetwork: (network) => set({ network }),
  setBalance: (balance) => set({ balance }),
  // setRuntimeLifecycle: (runtimeLifecycle) => set({ runtimeLifecycle }),
  // setRestAPI: (restAPI) => set({restAPI}),
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),

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

      // connect to runtimeLifecycle and restAPI
      // const { mkRuntimeLifecycle } = await import("@marlowe.io/runtime-lifecycle/browser");

      // const runtimeLifecycle = await mkRuntimeLifecycle({
      //   walletName: "nami",
      //   runtimeURL: process.env.NEXT_PUBLIC_RUNTIME_PREPROD_INSTANCE!,
      // });
      // try {
      //   const { mkRestClient } = await import("@marlowe.io/runtime-rest-client");
      //   const restAPI = mkRestClient(process.env.NEXT_PUBLIC_RUNTIME_PREPROD_INSTANCE!);
      //   const isHealthy = await restAPI.healthcheck();
      //   console.log(isHealthy)
      // } catch (error) {
      //   console.log("error doing MKRESTCLIENT", error);
      // }

      // console.log(restAPI)

      const currentWalletExtensions = get().walletExtensions;
      const walletExtensionSelected = currentWalletExtensions?.find((item) => item.name === walletName);
      const walletStorage: IWalletInStorage = {
        address: walletAddress[0],
        walletName: walletName.toLowerCase(),
        network,
        balance: Math.floor(balance).toString(),
      };
      if (walletAddress !== undefined) {
        window.localStorage.setItem("walletInfo", JSON.stringify(walletStorage));
        createCookie(JSON.stringify(walletStorage));
      }
      get().setWalletApi(walletApi);
      get().setWalletName(walletName);
      get().setWalletAddress(walletAddress[0]);
      get().setNetwork(network);
      get().setBalance(balance);
      get().setWalletExtensionSelected(walletExtensionSelected);
      // get().setRuntimeLifecycle(runtimeLifecycle);
      // get().setRestAPI(restAPI);
      get().onClose();
    } catch (error) {
      console.error("Failed to connect Wallet and load wallet State:");
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

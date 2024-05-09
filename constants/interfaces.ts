import type { SupportedWalletName } from "@marlowe.io/wallet/browser";

export interface IWalletInStorage {
    address: string;
    walletProvider: SupportedWalletName;
  }
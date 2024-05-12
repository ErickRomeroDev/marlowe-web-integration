
export interface IWalletInStorage {
    address: string;
    walletName: string;
    network: "mainnet" | "testnet";
    balance: string
  }
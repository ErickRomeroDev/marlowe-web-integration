import { IWalletInStorage } from "@/constants";
import { cookies } from "next/headers";

export const getCookies = (name: string) => {
    const cookieStore = cookies();
    const walletInfo = cookieStore.get(name);
    let address: string | undefined, walletName: string | undefined, network: string | undefined, balance: string | undefined;
    if (walletInfo !== undefined && walletInfo.value !== "") {
        const parsedWalletInfo = JSON.parse(walletInfo.value) as IWalletInStorage;
        address = parsedWalletInfo.address;
        walletName = parsedWalletInfo.walletName;
        network = parsedWalletInfo.network;
        balance = parsedWalletInfo.balance;
      } else {
        address = undefined;
        walletName = undefined;
        network = undefined;
        balance = undefined;
      }
      return {address, walletName, network, balance}
}
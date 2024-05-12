"use client";

import { IWalletInStorage } from "@/constants";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { SupportedWalletName } from "@marlowe.io/wallet/browser";
import { useState, useEffect } from "react";

const CardanoClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  const { loadWalletsExtensions, connectWallet } = useCardanoStore();

  useEffect(() => {
    const walletInfo = window.localStorage.getItem("walletInfo");
    if (walletInfo) {
      const { address, walletName, network, balance } = JSON.parse(walletInfo) as IWalletInStorage;
      connectWallet(walletName as SupportedWalletName);
    }
    loadWalletsExtensions();
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div>{children}</div>;
};

export default CardanoClientProvider;

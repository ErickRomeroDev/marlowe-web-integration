"use client";

import { WalletSelect } from "@/components/wallet-select";
import { IWalletInStorage } from "@/constants";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { SupportedWalletName } from "@marlowe.io/wallet/browser";
import React, { useState, useEffect } from "react";

const CardanoClientProvider = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const { loadWalletsExtensions, connectWallet } = useCardanoStore();

  useEffect(() => {
    const walletInfo = window.localStorage.getItem("walletInfo");
    if (walletInfo) {
      const { walletName } = JSON.parse(walletInfo) as IWalletInStorage;
      connectWallet(walletName as SupportedWalletName);
    }
    loadWalletsExtensions();
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <WalletSelect/>;
};

export default CardanoClientProvider;

"use client";

import { WalletSelect } from "@/components/wallet-select";
import { IWalletInStorage } from "@/constants";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { useLoadingWallet } from "@/hooks/use-loading-wallet";
import { SupportedWalletName } from "@marlowe.io/wallet/browser";
import React, { useState, useEffect } from "react";

const CardanoClientProvider = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const { loadWalletsExtensions, connectWallet } = useCardanoStore();
  const { setLoading, unsetLoading } = useLoadingWallet()

  useEffect(() => { 
    setLoading();
    loadWalletsExtensions();
    const run = async () => {              
      const walletInfo = window.localStorage.getItem("walletInfo");
      if (walletInfo) {
        const { walletName } = JSON.parse(walletInfo) as IWalletInStorage;
        await connectWallet(walletName as SupportedWalletName);        
      }           
    } 
    run().finally(() => unsetLoading())
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <WalletSelect/>;
};

export default CardanoClientProvider;

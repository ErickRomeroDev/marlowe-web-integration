"use client";

import Image from "next/image";
import { COLORS, ICON_SIZES } from "@/constants";
import { Balance } from "./balance";
import { CopyButton } from "./copyButton";
import { DisconnectButton } from "./disconnectButton";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { useEffect, useState } from "react";
import { useLoadingWallet } from "@/hooks/use-loading-wallet";
import { Skeleton } from "../ui/skeleton";

export const WalletWidget = () => {
  const { walletExtensionSelected, walletAddress, onOpen } = useCardanoStore();
  const [isMounted, setIsMounted] = useState(false);
  const { isLoading } = useLoadingWallet();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading || !isMounted) {
    return <WalletWidgetSkeleton />;
  }

  return (
    <div className="relative flex items-center">
      {walletAddress && walletExtensionSelected && (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center gap-x-2 rounded-3xl bg-[#ECEBF1] h-[48px] px-5">
            <Image
              src={walletExtensionSelected.icon}
              alt={"wallet"}
              width={20}
              height={20}
              priority
            />
            <Balance />
          </div>

          <div className="flex items-center justify-center gap-x-6">
            <CopyButton text={walletAddress} />
            <DisconnectButton />
          </div>
        </div>
      )}
      {walletAddress === undefined && (
        <div className="relative pl-20 ">
          <button
            className="flex items-center h-[48px] border-[1.5px] border-[#808191] rounded-full justify-center gap-3 px-5 hover:bg-[#Fafafa]"
            onClick={onOpen}
          >
            <Image
              src="/wallet.svg"
              alt=""
              height={20}
              width={20}
            />
            <h1>Connect</h1>
          </button>
        </div>
      )}
    </div>
  );
};

const WalletWidgetSkeleton = () => {
  return (
    <div className=" h-[48px] w-[270px] ">
      <Skeleton className="h-full w-full bg-[#ECEBF1] rounded-full" />
    </div>
  );
};

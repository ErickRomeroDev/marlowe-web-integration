"use client";

import Image from "next/image";
import { COLORS, ICON_SIZES } from "@/constants";
import { TailorButton, SIZE } from "@/components/tailor-button/tailorButton";
import { Balance } from "./balance";
import { CopyButton } from "./copyButton";
import { DisconnectButton } from "./disconnectButton";
import { useCardanoStore } from "@/hooks/use-cardano-store";

export const WalletWidget = () => {  
  const { walletExtensionSelected, walletAddress, onOpen } = useCardanoStore();

  return (
    <div className="relative flex h-8 items-center">
      {walletAddress ? (
        <div className="flex cursor-pointer items-center gap-1">
          <div            
            className="flex items-center justify-center gap-2 rounded-md border border-m-light-purple bg-m-light-purple px-6 py-1"
          >
            {walletExtensionSelected !== undefined ? (
              <Image src={walletExtensionSelected.icon} alt={"wallet"} width={ICON_SIZES.M} height={ICON_SIZES.M} priority />
            ) : (
              <></>
            )}
            <Balance />
          </div>

          <div className="flex w-16 items-center justify-center gap-2">
            <CopyButton text={walletAddress} />
            <DisconnectButton />
          </div>
        </div>
      ) : (
        <div className="relative w-32 md:w-44">
          <TailorButton
            color={COLORS.BLACK}
            size={SIZE.XSMALL}
            className="flex items-center justify-center gap-1"
            onClick={onOpen}
          >
            Connect <span className="hidden md:block">Wallet</span>
            <Image src="/connect.svg" alt="" height={ICON_SIZES.S} width={ICON_SIZES.S} />
          </TailorButton>
        </div>
      )}      
    </div>
  );
};

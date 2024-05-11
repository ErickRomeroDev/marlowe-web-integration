"use client";

import Image from "next/image";
import { useState } from "react";
import { COLORS, ICON_SIZES } from "@/constants";
import { TailorButton, SIZE } from "@/components/tailor-button/tailorButton";
import { Balance } from "./balance";
import { CopyButton } from "./copyButton";
import { DisconnectButton } from "./disconnectButton";
import { useCardanoStore } from "@/stores/cardano-store";
import { WalletSelect } from "../wallet-select";

export const WalletWidget = () => {
  const [open, setOpen] = useState(false);
  const { walletExtensions, walletExtensionSelected, walletAddress } = useCardanoStore();

  return (
    <div className="relative flex h-8 items-center">
      {walletAddress ? (
        <div className="flex cursor-pointer items-center gap-1">
          <div
            onClick={() => {}}
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
            onClick={() => setOpen(!open)}
          >
            Connect <span className="hidden md:block">Wallet</span>
            <Image src="/connect.svg" alt="" height={ICON_SIZES.S} width={ICON_SIZES.S} />
          </TailorButton>
        </div>
      )}
      {open && <WalletSelect />}
    </div>
  );
};

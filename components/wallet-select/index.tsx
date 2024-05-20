"use client";

import { type SupportedWalletName } from "@marlowe.io/wallet/browser";
import Image from "next/image";
import { useState } from "react";
import { COLORS, ICON_SIZES } from "@/constants";
import { TailorButton, SIZE } from "@/components/tailor-button/tailorButton";
import { WalletsSupported } from "./walletSupported";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLoadingWallet } from "@/hooks/use-loading-wallet";

export const WalletSelect = () => {
  const [openInfo, setOpenInfo] = useState(false);
  const { walletExtensions, connectWallet, balance, isOpen, onClose } =
    useCardanoStore();
  const { isLoading } = useLoadingWallet();

  const handleSelectWallet = (wallet: SupportedWalletName) => async () => {
    await connectWallet(wallet);
  };

  const toggleInfo = () => setOpenInfo((prev) => !prev);

  if (isLoading || walletExtensions === undefined) {
    return null;
  }

  if (walletExtensions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <div className="my-16 flex w-full flex-col justify-center  p-8 shadow-container md:w-2/3 lg:w-1/2 xl:w-1/3 2xl:w-1/4">
          <DialogContent>
            <p className="pb-2 text-2xl lg:text-2xl">No wallet found</p>
            <div className="flex flex-col gap-4">
              <p className="text-base text-m-disabled lg:text-lg">
                Please install a wallet to deploy a contract
              </p>
              <WalletsSupported />
            </div>
          </DialogContent>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="flex w-full flex-col justify-center shadow-container md:w-2/3 lg:w-1/2 xl:w-1/3 2xl:w-1/4">
        <DialogContent>
          <div className="flex items-center justify-center my-8 gap-3">
            <p className="pb-2 text-[26px]">Connect your wallet</p>
            <div className="relative">
              <Image
                src="/info.svg"
                alt="i"
                height={20}
                width={20}
                onClick={toggleInfo}
                className="cursor-pointer pb-1"
              />
              {openInfo && (
                <div className="absolute right-0 top-8 w-48 rounded-lg bg-white px-4 py-2 sm:left-0 lg:w-56">
                  <WalletsSupported />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 pb-8">
            {walletExtensions.sort().map((wallet) => {
              return (
                <button
                  className="flex items-center justify-between bg-[#F5F5F8] gap-2 rounded-[30px] px-10 py-5 hover:bg-[#FAFAFA]"
                  key={wallet.name}
                  onClick={handleSelectWallet(
                    wallet.name as SupportedWalletName
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className="text-[17px] capitalize">{wallet.name}</p>
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      height={ICON_SIZES.L}
                      width={ICON_SIZES.L}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};

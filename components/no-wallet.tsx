"use client"

import Image from "next/image";
import { Button } from "./ui/button";
import { useCardanoStore } from "@/hooks/use-cardano-store";

export const NoWallet = () => {
    const { onOpen } = useCardanoStore();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col space-y-5 items-center h-fit">
        <Image src="no-wallet.svg" alt="no wallet" height={140} width={140} />
        <span className="text-[#808191] text-[15px]">No wallet connected</span>
        <Button 
        onClick={onOpen}
        className="px-10 h-[48px] text-[15px] rounded-[30px]">Connect wallet</Button>
      </div>
    </div>
  );
};

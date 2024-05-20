import Image from "next/image";
import { ICON_SIZES } from "@/constants";
import { useCardanoStore } from "@/hooks/use-cardano-store";

export const DisconnectButton = () => {
  const { disconnectWallet } = useCardanoStore();

  return (
    <button
      className="flex items-center justify-center h-[48px] w-[48px] rounded-full  transition-colors bg-[#f33149] hover:bg-[#f33149]/80"
      onClick={disconnectWallet}
    >
      <Image src="/unplug.svg" alt="Disconnect" width={20} height={20} />
    </button>
  );
};

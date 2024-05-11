import Image from "next/image";
import { ICON_SIZES } from "@/constants";
import { useCardanoStore } from "@/stores/cardano-store";

export const DisconnectButton = () => {
  const { walletExtensions, connectWallet, disconnectWallet, balance } = useCardanoStore();

  return (
    <div onClick={disconnectWallet}>
      <abbr title="Disconnect Wallet">
        <Image src="/disconnect.svg" alt="Disconnect" width={ICON_SIZES.M} height={ICON_SIZES.M} />
      </abbr>
    </div>
  );
};

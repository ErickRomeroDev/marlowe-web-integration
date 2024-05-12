import { useCardanoStore } from "@/hooks/use-cardano-store";

export const Balance = () => {
  const { walletExtensions, connectWallet, disconnectWallet, balance } = useCardanoStore();

  return (
    <div>
      {balance?.toFixed(2)}
      &nbsp;
      <b>t₳</b>
    </div>
  );
};

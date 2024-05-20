import { useCardanoStore } from "@/hooks/use-cardano-store";

export const Balance = () => {
  const { balance, network } = useCardanoStore();

  return (
    <div className="flex text-[17px] text-[#808191]">
      {balance?.toFixed(2)}
      &nbsp;
      <div >{network === "testnet" ? "t₳" : "₳"}</div>
    </div>
  );
};

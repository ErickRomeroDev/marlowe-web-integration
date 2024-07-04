"use client";

import { useCardanoStore } from "@/hooks/use-cardano-store";
import { useEffect, useState } from "react";
import { PayoutId } from "@marlowe.io/runtime-core";
import { AvailablePayoutsType } from "../_components/my-payout";

export const AvailablePayouts = () => {
  const { walletAddress, runtimeLifecycle } = useCardanoStore();  
  const [availablePayouts, setAvailabePayouts] = useState<
    AvailablePayoutsType | undefined
  >(undefined);

  useEffect(() => {
    const run = async () => {
      if (walletAddress && runtimeLifecycle) {
        const availablePayoutsTemp = await runtimeLifecycle.payouts.available();
        setAvailabePayouts(availablePayoutsTemp);
      }      
    };
    run();
  }, [runtimeLifecycle, setAvailabePayouts]);

  const withDrawnPayouts = async (payoutId: PayoutId) => {
    if (walletAddress && runtimeLifecycle) {
      //There is no TxId in this version, but the function waits for the tx to be in the blockchain
      const txId = await runtimeLifecycle.payouts.withdraw([payoutId]);
      console.log("txId", txId);
    }
  };

  return (
    <div className="pt-20">
      {availablePayouts ?
        availablePayouts.map((item, index) => (
          <div
            className="cursor-pointer"
            onClick={() => withDrawnPayouts(item.payoutId)}
            key={index}
          >            
            `Role that can withdraw {item.role.assetName}` `ContractId:{" "}
            {item.contractId}`
          </div>
        )) : "loading..."}
    </div>
  );
};

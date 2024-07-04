"use client";

import { useCardanoStore } from "@/hooks/use-cardano-store";
import { useEffect, useState } from "react";
import { WithdrawnPayoutsType } from "../_components/my-payout";

export const WithdrawnPayouts = () => {
  const { walletAddress, runtimeLifecycle } = useCardanoStore();
  const [withdrawnPayouts, setWithdrawnPayouts] = useState<
    WithdrawnPayoutsType | undefined
  >(undefined);

  useEffect(() => {
    const run = async () => {
      if (walletAddress && runtimeLifecycle) {
        const withdrawnPayoutsTemp = await runtimeLifecycle.payouts.withdrawn();
        setWithdrawnPayouts(withdrawnPayoutsTemp);
      }      
    };
    run();
  }, [runtimeLifecycle, setWithdrawnPayouts]);

  return (
    <div className="pt-20">
      {withdrawnPayouts ? withdrawnPayouts.map((item, index) => (
        <div className="cursor-pointer" key={index}>         
          `Role that can withdraw {item.role.assetName}` `ContractId: $
          {item.contractId}`
        </div>
      )) : "Loading..."}
    </div>
  );
};

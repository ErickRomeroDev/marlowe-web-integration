"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Party } from "@marlowe.io/language-core-v1";
import { AddressBech32 } from "@marlowe.io/runtime-core";
import { useState } from "react";
import { deposit_tag, mkDepositContract } from "@/marlowe-contracts/src/contract-deposit/mk-deposit-contract";
import { useCardanoStore } from "@/hooks/use-cardano-store";

export const AskForCoffee = () => {
  const { walletAddress, runtimeLifecycle } = useCardanoStore();

  //initializing states
  const [sponsor, setSponsor] = useState<string>("");
  const [amt, setAmt] = useState<string>("");  

  //deploying smart contract
  const deploy = async (e: any) => {
    e.preventDefault();
    if (walletAddress) {
      //initialize contract parameters
      const amtLovelace = Number(amt) * 1000000;
      const drinker = walletAddress as AddressBech32;
      const drinkerBech32: Party = { address: drinker };
      const sponsor_ = sponsor as AddressBech32;
      const sponsorBech32: Party = { address: sponsor_ };

      // build the Smart Contract
      const myContract = mkDepositContract(amtLovelace, sponsorBech32, drinkerBech32);

      // deploy the Smart Contract and the await waits for submission
      const { id } = await runtimeLifecycle!.newContractAPI.create({
        contract: myContract,
        tags: deposit_tag,
      });
      console.log(`Contract Creation is: ${id}`);      
    }
  };

  return (
    <div className="flex flex-col space-y-4 py-8">
      <div>Ask for Coffee:</div>
      <form onSubmit={deploy} className="flex flex-col space-y-2">
        <Input type="text" placeholder="Sponsor" value={sponsor} onChange={(e) => setSponsor(e.target.value)} />
        <Input type="text" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <Button type="submit">Deploy Smart Contract</Button>
      </form>
    </div>
  );
};

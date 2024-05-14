"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Party } from "@marlowe.io/language-core-v1";
import { AddressBech32, ContractId } from "@marlowe.io/runtime-core";
import { useState } from "react";
import { deposit_tag, mkDepositContract } from "@/marlowe-contracts/contract-deposit/mk-deposit-contract";
import { useCardanoStore } from "@/hooks/use-cardano-store";

export const DepositTest = () => {
  const { runtimeLifecycle, walletAddress } = useCardanoStore();
  const [contractId, setContractId] = useState<ContractId | undefined>(undefined);
  const [bob, setBob] = useState<string>("");
  const [amt, setAmt] = useState<string>("");

  //deploying smart contract
  const deploy = async (e: any) => {
    e.preventDefault();
    if (walletAddress) {
      //initialize contract parameters
      const amtLovelace = Number(amt) * 1000000;
      const aliceAddr = walletAddress as AddressBech32;
      const aliceBech32: Party = { address: aliceAddr };
      const bobAddress = bob as AddressBech32;
      const bobBech32: Party = { address: bobAddress };

      // build the Smart Contract
      const myContract = mkDepositContract(amtLovelace, aliceBech32, bobBech32);

      // deploy the Smart Contract and the await waits for submission
      const { id } = await runtimeLifecycle!.newContractAPI.create({
        contract: myContract,
        tags: deposit_tag,
      });
      console.log(`Contract Creation is: ${id}`);
      setContractId(id);
    }
  };

  const depositTx = async () => {
    if (contractId && runtimeLifecycle) {
      const contractInstanceAPI = await runtimeLifecycle.newContractAPI.load(contractId);
      const contractDetails = await contractInstanceAPI.getDetails();
      if (contractDetails.type === "active") {
        const [applicableAction] = await runtimeLifecycle.applicableActions.getApplicableActions(contractDetails);
        if (applicableAction.type !== "Choice") {
          const applicableInput = await runtimeLifecycle.applicableActions.getInput(contractDetails, applicableAction);
          const txId = await contractInstanceAPI.applyInput({ input: applicableInput });
          console.log(`transaction submited ok ${txId}`);
        }
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4 py-8">
      <form onSubmit={deploy} className="flex flex-col space-y-2">
        <Input type="text" placeholder="Bob" value={bob} onChange={(e) => setBob(e.target.value)} />
        <Input type="text" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <Button type="submit">Deploy Smart Contract {contractId}</Button>
      </form>
      <Button onClick={depositTx}>Deposit</Button>
    </div>
  );
};

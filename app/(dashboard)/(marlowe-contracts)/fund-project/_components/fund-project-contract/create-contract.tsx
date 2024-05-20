"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressBech32 } from "@marlowe.io/runtime-core";
import { useState } from "react";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { FundMyProjectParameters } from "@/lib/contracts-ui/fund-my-project";

export const CreateContract = () => {
  const { walletAddress, runtimeLifecycle } = useCardanoStore();

  //initializing states
  const [VC, setVC] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [finalDate, setFinalDate] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState<string>("");

  //deploying smart contract
  const deploy = async (e: any) => {
    e.preventDefault();
    const { mkSourceMap } = await import("@/lib/contracts-ui/experimental-features/source-map");
    const { fundMyProjectTag, fundMyProjectTemplate, mkFundMyProject } = await import("@/lib/contracts-ui/fund-my-project");
    if (walletAddress && runtimeLifecycle) {
      //initialize contract parameters
      const schema: FundMyProjectParameters = {
        amount: Number(amount) * 1000000,
        payee: walletAddress as AddressBech32,
        payer: VC as AddressBech32,
        depositDeadline: new Date(finalDate),
        projectName,
        githubUrl,
      };

      const metadata = fundMyProjectTemplate.toMetadata(schema);
      const sourceMap = await mkSourceMap(runtimeLifecycle, mkFundMyProject(schema));
      const contractInstance = await sourceMap.createContract({
        tags: fundMyProjectTag,
        metadata,
      });

      console.log(`Contract created with id ${contractInstance.id}`);

      // this is another option to wait for a tx when using the instance of the contract
      await contractInstance.waitForConfirmation();
      //   await waitIndicator(lifecycleNami.wallet, contractIdToTxId(contractInstance.id));

      console.log(`Contract id ${contractInstance.id} was successfully submited to the blockchain`);
    }
  };

  return (
    <div className="flex flex-col space-y-4 py-8">
      <div>Ask for Coffee:</div>
      <form onSubmit={deploy} className="flex flex-col space-y-2">
        <Input type="text" placeholder="Sponsor" value={VC} onChange={(e) => setVC(e.target.value)} />
        <Input type="text" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input type="text" placeholder="Final Date" value={finalDate} onChange={(e) => setFinalDate(e.target.value)} />
        <Input type="text" placeholder="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        <Input type="text" placeholder="Github URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
        <Button type="submit">Deploy Smart Contract</Button>
      </form>
    </div>
  );
};

import { useCardanoStore } from "@/hooks/use-cardano-store";
import { useState } from "react";
import { ContractId } from "@marlowe.io/runtime-core";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FundMyProjectActions, FundMyProjectParameters, FundMyProjectState } from "@/lib/contracts-ui/fund-my-project";
import { SingleInputTx } from "@marlowe.io/language-core-v1/semantics";
import { ContractInfoPlus } from "./contract-infoPlus";
import { ContractInstanceAPI, NewApplicableActionsAPI } from "@marlowe.io/runtime-lifecycle/api";

export type ContractInfo = {
  scheme: FundMyProjectParameters;
  inputHistory: SingleInputTx[];
  state: FundMyProjectState;
  statePlus: any;
  choices: FundMyProjectActions;
  contractInstance: ContractInstanceAPI;
  applicableActions: NewApplicableActionsAPI;
};

export const LoadContract = () => {
  const { restAPI, runtimeLifecycle, walletAddress } = useCardanoStore();
  const [contractId, setContractId] = useState<string>("");
  const [contractInfo, setContractInfo] = useState<ContractInfo | undefined>(undefined);

  const runContracts = async (e: any, id: string) => {
    e.preventDefault();
    if (walletAddress && restAPI && runtimeLifecycle) {
      const { fundMyProjectValidation, fundMyProjectGetState, fundMyProjectStatePlus, fundMyProjectGetActions } = await import(
        "@/lib/contracts-ui/fund-my-project"
      );
      const cid = id as ContractId;

      const result = await fundMyProjectValidation(runtimeLifecycle, cid);
      if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
        return null;
      }
      const contractInstance = await runtimeLifecycle.newContractAPI.load(cid);
      const inputHistory = await contractInstance.getInputHistory();
      const state = fundMyProjectGetState(datetoTimeout(new Date()), inputHistory, result.sourceMap);
      const applicableActions = await contractInstance.evaluateApplicableActions();
      const choices = fundMyProjectGetActions(applicableActions, state);
      const statePlus = fundMyProjectStatePlus(state, result.scheme);
      const contractInfo = {
        scheme: result.scheme,
        inputHistory,
        state,
        statePlus,
        choices,
        contractInstance,
        applicableActions,
      };
      console.log(contractInfo);
      setContractInfo(contractInfo);
    }
  };

  return (
    <div className="flex flex-col space-y-4 py-8">
      <div>Input ContractId: </div>
      <form onSubmit={(e) => runContracts(e, contractId)} className="flex flex-col space-y-2">
        <Input type="text" placeholder="Sponsor" value={contractId} onChange={(e) => setContractId(e.target.value)} />
        <Button type="submit">Load Contract</Button>
      </form>
      <div>See Contract Information:</div>
      <ContractInfoPlus contractInfo={contractInfo} />
    </div>
  );
};

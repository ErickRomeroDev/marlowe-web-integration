"use client";

import { useCardanoStore } from "@/hooks/use-cardano-store";
import { ContractHeader, GetContractsRequest } from "@marlowe.io/runtime-rest-client/contract";
import { useEffect, useState } from "react";
import { AddressBech32, ContractId } from "@marlowe.io/runtime-core";
import { FundMyProjectActions, FundMyProjectParameters, FundMyProjectState } from "@/lib/contracts-ui/fund-my-project";
import { MarloweState, datetoTimeout } from "@marlowe.io/language-core-v1";
import { SingleInputTx } from "@marlowe.io/language-core-v1/semantics";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContractInfoPlus } from "./contract-infoPlus";
import { ContractInstanceAPI, NewApplicableActionsAPI } from "@marlowe.io/runtime-lifecycle/api";

type ContractInfoBasic = {
  header: ContractHeader;
  scheme: FundMyProjectParameters;
  stateMarlowe: MarloweState | undefined;
} | null;

export type ContractInfo = {
  scheme: FundMyProjectParameters;
  inputHistory: SingleInputTx[];
  state: FundMyProjectState;
  statePlus: any;
  choices: FundMyProjectActions;
  contractInstance: ContractInstanceAPI;
  applicableActions: NewApplicableActionsAPI;
};

export const MyActiveContracts = () => {
  const { restAPI, runtimeLifecycle, walletAddress } = useCardanoStore();
  const [contractInfoBasic, setContractInfobasic] = useState<ContractInfoBasic[] | undefined>(undefined);
  const [contractInfo, setContractInfo] = useState<ContractInfo | undefined>(undefined);
  const [contractWindow, setContractWindow] = useState(false);
  const [loading, setLoading] = useState(false);
  const tags_array = ["FUND_MY_PROJECT_VERSION_1", "FILTER-VERSION_1"];

  // get contract Info
  useEffect(() => {
    const runContractsBasic = async () => {
      if (walletAddress && restAPI && runtimeLifecycle) {
        const { fundMyProjectMetadata } = await import("@/lib/contracts-ui/fund-my-project");
        const contractsRequest: GetContractsRequest = {
          tags: tags_array,
          partyAddresses: [walletAddress as AddressBech32],
        };
        const contractHeaders = await restAPI.getContracts(contractsRequest);

        const contractInfoBasic = await Promise.all(
          contractHeaders.contracts.map(async (item) => {
            const result = await fundMyProjectMetadata(restAPI, item.contractId);
            if (result === "InvalidMarloweTemplate") {
              return null;
            }
            return {
              header: item,
              scheme: result.scheme,
              stateMarlowe: result.stateMarlowe,
            };
          })
        );
        console.log(contractInfoBasic);
        setContractInfobasic(contractInfoBasic);
      }
    };
    runContractsBasic();
  }, [walletAddress, restAPI, runtimeLifecycle]);

  const runContracts = async (id: string) => {
    if (walletAddress && restAPI && runtimeLifecycle) {
      setContractWindow(true);
      setLoading(true);
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
      setLoading(false);
    }
  };

  const closeWindow = () => {
    setContractWindow(false);
    setContractInfo(undefined);
  };

  return (
    <div>
      My active contracts:{" "}
      {contractInfoBasic &&
        contractInfoBasic.map(
          (item) =>
            item && (
              <div key={item.header.contractId}>
                <div>{item.scheme.payee}</div>
                <div className="cursor-pointer" onClick={() => runContracts(item.header.contractId)}>
                  See more of this contract
                </div>
                <Dialog open={contractWindow} onOpenChange={closeWindow}>
                  <DialogContent>{loading ? "loading" : <ContractInfoPlus contractInfo={contractInfo} />}</DialogContent>
                </Dialog>
              </div>
            )
        )}
    </div>
  );
};

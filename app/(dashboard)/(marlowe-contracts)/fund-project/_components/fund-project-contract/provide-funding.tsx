"use client";

import { useCardanoStore } from "@/hooks/use-cardano-store";
import { GetContractsRequest } from "@marlowe.io/runtime-rest-client/contract";
import { useEffect } from "react";
import { AddressBech32 } from "@marlowe.io/runtime-core";
import { datetoTimeout } from "@marlowe.io/language-core-v1";

export const ProvideFunding = () => {
  const { restAPI, runtimeLifecycle, walletAddress } = useCardanoStore();
  const tags_array = ["FUND_MY_PROJECT_VERSION_1", "FILTER-VERSION_1"];

  // get contract Info
  useEffect(() => {    
    const run = async () => {
      if (walletAddress && restAPI && runtimeLifecycle) {
        const { fundMyProjectValidation, fundMyProjectGetState, fundMyProjectPrintState, fundMyProjectGetActions } = await import("@/lib/contracts-ui/fund-my-project");
        const contractsRequest: GetContractsRequest = {
          tags: tags_array,
          partyAddresses: [walletAddress as AddressBech32],
        };
        const contractHeaders = await restAPI.getContracts(contractsRequest);       
        
        const contractOptions = await Promise.all(
          contractHeaders.contracts.map(async (item) => {
            const result = await fundMyProjectValidation(runtimeLifecycle, item.contractId);
            if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
              return null;
            }
            const contractInstance = await runtimeLifecycle.newContractAPI.load(item.contractId);
            const inputHistory = await contractInstance.getInputHistory();
            const contractState = fundMyProjectGetState(datetoTimeout(new Date()), inputHistory, result.sourceMap);
            fundMyProjectPrintState(contractState, result.scheme);
            const applicableActions = await contractInstance.evaluateApplicableActions();
            const choices = fundMyProjectGetActions(applicableActions, contractState);
            return {
              header: item,
              scheme: result.scheme,
              inputHistory,
              state: contractState,
              choices,
            };
          })
        );
        console.log(contractOptions);
      }
    };
    run();
  }, [walletAddress, restAPI, runtimeLifecycle]);
  return (<div>Provide Funding</div>);
};

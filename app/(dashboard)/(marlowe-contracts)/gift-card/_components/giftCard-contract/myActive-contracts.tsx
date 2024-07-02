"use client";

import { useCardanoStore } from "@/hooks/use-cardano-store";
import {
  ContractHeader,
  GetContractsRequest,
} from "@marlowe.io/runtime-rest-client/contract";
import { useEffect, useState } from "react";
import { AddressBech32, ContractId } from "@marlowe.io/runtime-core";
import {
  ProjectActions,
  ProjectParameters,
  ProjectState,
} from "@/lib/contracts-ui/giftCard";
import { MarloweState, datetoTimeout } from "@marlowe.io/language-core-v1";
import { SingleInputTx } from "@marlowe.io/language-core-v1/semantics";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContractInfoPlus } from "./contract-infoPlus";
import {
  ContractInstanceAPI,
  NewApplicableActionsAPI,
} from "@marlowe.io/runtime-lifecycle/api";
import Image from "next/image";
import { toast } from "sonner";
import { Hint } from "@/components/hint";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type ContractInfoBasic = {
  header: ContractHeader;
  scheme: ProjectParameters;  
} | null;

export type ContractInfo = {
  scheme: ProjectParameters;
  inputHistory: SingleInputTx[];
  state: ProjectState;
  statePlus: any;
  choices: ProjectActions;
  contractInstance: ContractInstanceAPI;
  applicableActions: NewApplicableActionsAPI;
};

export const MyActiveContracts = () => {
  const { restAPI, runtimeLifecycle, walletAddress } = useCardanoStore();
  const [contractInfoBasic, setContractInfobasic] = useState<
    ContractInfoBasic[] | undefined
  >(undefined);
  const [contractInfo, setContractInfo] = useState<ContractInfo | undefined>(
    undefined
  );
  const [activeDialogIndex, setActiveDialogIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const tags_array = ["GIFT_CARD"];

  // get contract Info
  useEffect(() => {
    const runContractsBasic = async () => {
      if (walletAddress && restAPI && runtimeLifecycle) {
        setLoading(true);
        const { projectValidationMetadata } = await import(
          "@/lib/contracts-ui/giftCard"
        );
        const contractsRequest: GetContractsRequest = {
          tags: tags_array,
          partyAddresses: [walletAddress as AddressBech32],
        };
        const contractHeaders = await restAPI.getContracts(contractsRequest);

        const contractInfoBasic = await Promise.all(
          contractHeaders.contracts.map(async (item) => {
            const result = await projectValidationMetadata(
              runtimeLifecycle,
              item.contractId
            );
            if (result === "InvalidMarloweTemplate") {
              return null;
            }
            return {
              header: item,
              scheme: result.scheme,              
            };
          })
        );
        console.log(contractInfoBasic);
        setContractInfobasic(contractInfoBasic);
        setLoading(false);
      }
    };
    runContractsBasic();
  }, [walletAddress, restAPI, runtimeLifecycle]);

  const runContracts = async (id: string, index: number) => {
    if (walletAddress && restAPI && runtimeLifecycle) {
      setActiveDialogIndex(index);
      setLoadingInfo(true);
      const {
        projectValidationSource,
        projectGetState,
        projectGetStatePlus,
        projectGetMyActions,
      } = await import("@/lib/contracts-ui/giftCard");
      const cid = id as ContractId;

      const result = await projectValidationSource(runtimeLifecycle, cid);
      if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
        return null;
      }
      const contractInstance = await runtimeLifecycle.newContractAPI.load(cid);
      const inputHistory = await contractInstance.getInputHistory();
      const state = await projectGetState(
        datetoTimeout(new Date()),
        contractInstance,
        result.sourceMap
      );
      const applicableActions =
        await contractInstance.evaluateApplicableActions();
      const choices = await projectGetMyActions(contractInstance, state);
      const statePlus = projectGetStatePlus(state, result.scheme);
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
      setLoadingInfo(false);
    }
  };

  const closeWindow = () => {  
    setActiveDialogIndex(null);          
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Contract ID copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy contract id");
    }
  };

  return (
    <div className="flex flex-col bg-white shadow-md py-8 pr-8 pl-12 rounded-[30px] min-w-[800px]  h-4/5">
      <div className="text-[22px]">Fund my project / Contracts</div>
      {loading ? (
        <>
          <div className="grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1fr,0.3fr] mt-7 mb-2 text-[14px] text-[#808191] pr-[14px]">
            <div className="">Contract ID</div>
            <div className=" pl-3">Project name</div>
            <div className="text-center">Project Link</div>
            <div className="text-center">Amount</div>
            <div className="text-center">Deadline</div>
            <div></div>
          </div>
          <div className="flex flex-col space-y-5 mt-5">
            <FundMeSkeleton />
            <FundMeSkeleton />
            <FundMeSkeleton />
            <FundMeSkeleton />
          </div>
        </>
      ) : 
       contractInfoBasic?.length === 0 ? (
        <div className="flex flex-col flex-grow space-y-4 items-center justify-center">
          <Image 
          src="no-projects.svg"
          alt="no projects"
          height={90}
          width={90}
          />
          <span className="text-[16px] text-[#808191]">No projects to fund</span>
        </div>
      ) :
      (
        <>
          <div className="grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1fr,0.3fr] mt-7 mb-2 text-[14px] text-[#808191] pr-[14px]">
            <div className="">Contract ID</div>
            <div className=" pl-3">Project name</div>
            <div className="text-center">Project Link</div>
            <div className="text-center">Amount</div>
            <div className="text-center">Deadline</div>
            <div></div>
          </div>
          <ul className="overflow-y-auto flex-grow mb-2">
            {contractInfoBasic &&
              contractInfoBasic.map(
                (item, index) =>
                  item && (
                    <li
                      className="text-[#121216] items-center  text-[14px] my-5  grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1fr,0.3fr]"
                      key={item.header.contractId}
                    >
                      <div className="flex gap-x-2.5 items-center">
                        {`${item.header.contractId.substring(0, 6)}...${item.header.contractId.slice(-6)}`}
                        <Image
                          className="cursor-pointer"
                          src="/copy-purple.svg"
                          alt="Copy"
                          width={15}
                          height={15}
                          onClick={() =>
                            handleCopyToClipboard(item.header.contractId)
                          }
                        />
                      </div>
                      <div className="text-start pl-3">
                        {item.scheme.beneficiaryName}
                      </div>
                      <div className="flex justify-center">                        
                        
                      </div>
                      <div className="text-center">
                        {(Number(item.scheme.amount) / 1000000).toFixed(2)} ADA
                      </div>
                      <div className="w-auto text-center ">
                        {item.scheme.depositDeadline.getMonth()}/
                        {item.scheme.depositDeadline.getDate()}
                        <span> </span>
                        {item.scheme.depositDeadline.getHours()}:
                        {item.scheme.depositDeadline.getMinutes()}
                      </div>
                      <div>
                        <Hint
                          label="more info"
                          side="bottom"
                          align="start"
                          sideOffset={5}
                        >
                          <button
                            className="cursor-pointer rounded-[15px] h-[38px] hover:bg-[#fafafa]"
                            onClick={() => runContracts(item.header.contractId, index)}
                          >
                            <Image
                              src="/ellipsis.svg"
                              alt="info"
                              width={22}
                              height={22}
                            />
                          </button>
                        </Hint>
                      </div>
                      <>{console.log(index)}</>
                      <Dialog open={activeDialogIndex === index} onOpenChange={closeWindow}>
                        <DialogContent>
                          {loadingInfo ? (
                            <div className="flex flex-col space-y-4 p-4">
                              <h1 className="text-[22px] pb-5">Contract details</h1>
                              <FundMeSkeleton />
                              <FundMeSkeleton />
                              <FundMeSkeleton />
                              <div className="pt-4">
                                <FundMeSkeleton />
                              </div>
                            </div>
                          ) : (
                            <ContractInfoPlus contractInfo={contractInfo} setWindow={setActiveDialogIndex} />
                          )}
                        </DialogContent>
                      </Dialog>
                    </li>
                  )
              )}
          </ul>
        </>
      )}
    </div>
  );
};

export const FundMeSkeleton = () => {
  return (
    <div className="rounded-[15px] h-[38px] w-full bg-[#F5F5F8] ">
      <Skeleton />
    </div>
  );
};

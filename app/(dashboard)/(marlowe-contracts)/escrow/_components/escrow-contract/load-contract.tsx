import { useCardanoStore } from "@/hooks/use-cardano-store";
import { useState } from "react";
import { ContractId } from "@marlowe.io/runtime-core";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ProjectActions,
  ProjectParameters,
  ProjectState,
} from "@/lib/contracts-ui/escrow";
import { SingleInputTx } from "@marlowe.io/language-core-v1/semantics";
import {
  ContractInstanceAPI,
  NewApplicableActionsAPI,
} from "@marlowe.io/runtime-lifecycle/api";
import { toast } from "sonner";
import { FundMeSkeleton } from "./myActive-contracts";
import Image from "next/image";
import { ContractInfoPlus } from "./contract-infoPlus"; 

export type ContractInfo = {
  scheme: ProjectParameters;
  inputHistory: SingleInputTx[];
  state: ProjectState;
  statePlus: any;
  choices: ProjectActions;
  contractInstance: ContractInstanceAPI;
  applicableActions: NewApplicableActionsAPI;
};

export const LoadContract = () => {
  const { restAPI, runtimeLifecycle, walletAddress } = useCardanoStore();
  const [contractId, setContractId] = useState<string>("");
  const [contractInfo, setContractInfo] = useState<ContractInfo | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  

  const runContracts = async (e: any, id: string) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (walletAddress && restAPI && runtimeLifecycle) {
        const {
          projectValidationSource,
          projectGetState,
          projectGetStatePlus,
          projectGetMyActions,
        } = await import("@/lib/contracts-ui/escrow");
        const cid = id as ContractId;

        const result = await projectValidationSource(runtimeLifecycle, cid);
        if (
          result === "InvalidMarloweTemplate" ||
          result === "InvalidContract"
        ) {
          return null;
        }
        const contractInstance =
          await runtimeLifecycle.newContractAPI.load(cid);
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
        setLoading(false);
      }
    } catch (error) {
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white shadow-md p-8 rounded-[30px] min-w-[600px] max-w-[700px]">
      <form
        onSubmit={(e) => runContracts(e, contractId)}
        className="flex items-center space-x-2 pb-5"
      >
        <Input
          className=" rounded-xl shadow h-[38px]"
          type="text"
          placeholder="Search for contract ID"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
        />
        {loading ? (
          <Button
          disabled={loading} 
            className="rounded-[20px] h-[38px] w-[170px] gap-x-3 bg-[#9D78FF] hover:bg-[#9D78FF]/80"
            type="submit"
          >
            <h1>Loading</h1>
            <Image
              className="animate-spin"
              src="/loader-circle.svg"
              alt="loading"
              height={20}
              width={20}
            />
          </Button>
        ) : (
          <Button
          
          className="rounded-[20px] h-[38px] w-[170px] bg-[#9D78FF] hover:bg-[#9D78FF]/80"
            type="submit"
          >
            Load Contract
          </Button>
        )}
      </form>
      {loading ? (
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
        <ContractInfoPlus contractInfo={contractInfo} />
      )}
    </div>
  );
};


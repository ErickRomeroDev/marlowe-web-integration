"use client";

import { toast } from "sonner";
import { ContractId, AddressBech32 } from "@marlowe.io/runtime-core";
import { useEffect, useState } from "react";
import { delay } from "@/lib/utils";
import {
  ApplicableInput,
  ApplyApplicableInputRequest,
} from "@marlowe.io/runtime-lifecycle/api";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import {
  ContractHeader,
  GetContractsRequest,
} from "@marlowe.io/runtime-rest-client/contract";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

type ContractInfo = {
  contractHeader: ContractHeader;
  deposit: ApplicableInput | null;
  deposited: boolean;
};

export const CoffeesToFund = () => {
  const { restAPI, runtimeLifecycle, walletAddress } = useCardanoStore();
  const [loading, setLoading] = useState(true);

  //initializing states
  const [contractInfos, setContractInfos] = useState<ContractInfo[]>([]);

  //get contract Info
  useEffect(() => {
    const run = async () => {
      if (walletAddress && restAPI && runtimeLifecycle) {
        setLoading(true);
        let tags_array = ["buy-me-a-coffee-sponsor"];
        const contractsRequest: GetContractsRequest = {
          tags: tags_array,
          partyAddresses: [walletAddress as AddressBech32],
        };
        const contractHeaders = await restAPI.getContracts(contractsRequest);
        console.log({ contractHeaders });

        const contractInfosTemp = await Promise.all(
          contractHeaders.contracts.map(
            async (contractHeader: ContractHeader) => {
              const contractInstanceAPI =
                await runtimeLifecycle.newContractAPI.load(
                  contractHeader.contractId
                );
              const contractDetails = await contractInstanceAPI.getDetails();
              console.log({ contractDetails });
              const applicableActions =
                await runtimeLifecycle.applicableActions.getApplicableActions(
                  contractDetails
                );
              console.log({ applicableActions });
              if (
                applicableActions.length > 0 &&
                contractDetails.type === "active" &&
                applicableActions[0].type !== "Choice"
              ) {
                const applicableInput =
                  await runtimeLifecycle.applicableActions.getInput(
                    contractDetails,
                    applicableActions[0]
                  );
                return {
                  contractHeader,
                  deposit: applicableInput,
                  deposited: false,
                };
              } else {
                return { contractHeader, deposit: null, deposited: true };
              }
            }
          )
        );
        setContractInfos(contractInfosTemp);
        setLoading(false);
        console.log({ contractInfosTemp });
      }
    };
    run();
  }, [walletAddress, restAPI]);

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Contract ID copied to clipboard!"); // Optionally notify the user
    } catch (err) {
      toast.error("Failed to copy contract id");
    }
  };

  return (
    <div className="flex flex-col bg-white shadow-md py-8 pr-8 pl-12 rounded-[30px]   h-4/5">
      <div className="text-[22px]">Buy me a coffee / Contracts</div>
      {loading ? (
        <div className="grid grid-cols-2 mt-7 mb-2 gap-y-20 text-[14px] text-[#808191] h-full   ">
          <div className="flex flex-col space-y-6 w-4/5">
            <div>Contract ID</div>
            <ContractsSkeleton />
            <ContractsSkeleton />
            <ContractsSkeleton />
            <ContractsSkeleton />
          </div>
          <div className="flex justify-center">
            <div className="w-1/2 flex flex-col space-y-6 text-center ">
              <div>Status</div>
              <ContractsSkeleton />
              <ContractsSkeleton />
              <ContractsSkeleton />
              <ContractsSkeleton />
            </div>
          </div>
        </div>
      ) : contractInfos.length === 0 ? (
        <div className="flex flex-col flex-grow space-y-4 items-center justify-center">
          <Image 
          src="no-coffee.svg"
          alt="no coffee"
          height={90}
          width={90}
          />
          <span className="text-[16px] text-[#808191]">No coffees to fund</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 mt-7 mb-2 text-[14px] text-[#808191] ">
            <div>Contract ID</div>
            <div className="text-center pr-5">Status</div>
          </div>
          <ul className="overflow-y-auto flex-grow mb-2">
            {contractInfos.map(
              ({ contractHeader, deposit, deposited }, index) => (
                <li
                  className="text-[#121216]  text-[14px] my-5 font-normal grid grid-cols-2 text-center"
                  key={index}
                >
                  <div className="flex gap-x-2.5 items-center">
                    {`${contractHeader.contractId.substring(0, 6)}...${contractHeader.contractId.slice(-6)}`}
                    <Image
                      className="cursor-pointer"
                      src="/copy-purple.svg"
                      alt="Copy"
                      width={15}
                      height={15}
                      onClick={() =>
                        handleCopyToClipboard(contractHeader.contractId)
                      }
                    />
                  </div>
                  <div>
                    {deposited ? (
                      <button className="h-[38px] rounded-[20px] bg-[#ECEBF1] px-6 text-[#808191]">
                        Funded
                      </button>
                    ) : (
                      <DepositButton
                        contractId={contractHeader.contractId}
                        deposit={deposit}
                      />
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        </>
      )}
    </div>
  );
};

type DepositButtonProps = {
  contractId: ContractId;
  deposit: ApplicableInput | null;
};

const DepositButton: React.FC<DepositButtonProps> = ({
  contractId,
  deposit,
}) => {
  const { runtimeLifecycle } = useCardanoStore();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const go = async function () {
    try {
      setLoading(true);
      if (runtimeLifecycle && deposit) {
        const applyApplicableInput: ApplyApplicableInputRequest = {
          input: deposit,
        };
        const TxHash = await runtimeLifecycle.applicableActions.applyInput(
          contractId,
          applyApplicableInput
        );
        toast.success(
          "Your transaction was created. Processing may take 10 to 30 seconds. Please wait..."
        );
        await runtimeLifecycle.wallet.waitConfirmation(TxHash);
        setLoading(false);
        setSent(true);
        toast.success("Your transaction was successfully submitted.");
      }
    } catch (error) {
      setLoading(false);
      toast.error("Something went wrong.");
    }
  };

  return (
    <>
      {sent ? (
        <button className="h-[38px] rounded-[20px] bg-[#ECEBF1] px-4 text-[#808191]">
          Deposited
        </button>
      ) : loading ? (
        <button
          className="h-[38px] rounded-[20px] text-[#808191]"
          onClick={() => go()}
        >
          <div className="flex gap-x-2">
            <span>Processing</span>
            <Image
              className="animate-spin"
              src="/loader-circle.svg"
              alt="loading"
              height={20}
              width={20}
            />
          </div>
        </button>
      ) : (
        <button
          className="h-[38px] rounded-[20px] bg-[#9D78FF] hover:bg-[#9D78FF]/80 px-6 text-white"
          onClick={() => go()}
        >
          <span>Deposit</span>
        </button>
      )}
    </>
  );
};

const ContractsSkeleton = () => {
  return (
    <div className="rounded-[20px] h-[38px] w-full bg-[#F5F5F8] ">
      <Skeleton />
    </div>
  );
};

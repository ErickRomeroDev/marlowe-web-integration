"use client";

import { ProjectActions } from "@/lib/contracts-ui/paymentSplitter";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import Image from "next/image";
import { toast } from "sonner";
import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContractInfo } from "./load-contract";

interface ContractInfoPlusInterface {
  contractInfo: ContractInfo | undefined;
  setWindow?: Dispatch<SetStateAction<number | null>>;
}

export const ContractInfoPlus = ({ contractInfo, setWindow }: ContractInfoPlusInterface) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { runtimeLifecycle } = useCardanoStore();

  const applyContractInput = async (action: ProjectActions[number]) => {
    try {
      if (runtimeLifecycle && contractInfo && action.value) {
        setLoading(true);
        if (action.value.type === "Choice") {
          console.log("Applying input");
          const { applyInputChoice } = await import(
            "@/lib/contracts-ui/paymentSplitter"
          );          
          const txId = await applyInputChoice(
            contractInfo.contractInstance,
            action.value
          );
          toast.success("Your transaction was created. Processing may take 10 to 30 seconds. Please wait...");
          console.log(`Input applied with txId ${txId}`);
          await runtimeLifecycle.wallet.waitConfirmation(txId);
          console.log(`Input applied with txId ${txId} submitted to the blockchain`);
          toast.success("Your transaction was successfully submitted to the blockchain");
          setLoading(false);
          setSubmitted(true);
        } else {
          switch (action.value.type) {
            case "Advance":
            case "Deposit":
              console.log("Applying input");
              const applicableInput = await contractInfo.applicableActions.toInput(action.value);
              const txId = await contractInfo.applicableActions.apply({
                input: applicableInput,
              });
              toast.success("Your transaction was created. Processing may take 10 to 30 seconds. Please wait...");
              console.log(`Input applied with txId ${txId}`);
              await runtimeLifecycle.wallet.waitConfirmation(txId);
              console.log(`Input applied with txId ${txId} submitted to the blockchain`);
              toast.success("Your transaction was successfully submitted to the blockchain");
              setLoading(false);
              setSubmitted(true);
          }
        }
      }
      if (setWindow) {
        setWindow(null);
      }
    } catch (error) {
      setLoading(false);
      toast.error("Something went wrong.");
    }
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
    <>
      {contractInfo && (
        <div className="space-y-4 p-4 text-[14px] text-[#121216]">
          <h1 className="text-[22px]">Contract details</h1>
          <div className="flex justify-between text-[#121216]">
            <section className="flex flex-col gap-y-1">
              <h1 className="text-[#808191]">Contract ID</h1>
              <div className="flex gap-x-2.5 items-center">
                {`${contractInfo.contractInstance.id.substring(0, 6)}...${contractInfo?.contractInstance.id.slice(-6)}`}
                <Image
                  className="cursor-pointer"
                  src="/copy-purple.svg"
                  alt="Copy"
                  width={15}
                  height={15}
                  onClick={() => handleCopyToClipboard(contractInfo.contractInstance.id)}
                />
              </div>
            </section>
            <section className="flex flex-col gap-y-1">
              <h1 className="text-[#808191]">Project name</h1>
              <div>{contractInfo?.scheme.projectName}</div>
            </section>
            <section className="flex flex-col gap-y-1">
              <h1 className="text-[#808191]">Amount</h1>
              <div>{(Number(contractInfo.scheme.amount) / 1000000).toFixed(2)} ADA</div>
            </section>
          </div>
          <div className="flex h-[38px] justify-between">
            <div className="flex gap-x-3 items-center bg-[#F5F5F8] px-5 rounded-[20px]">
              <span className="text-[#808191]">Deposit Deadline</span>
              <p className="text-[#F33149]">
                {contractInfo.scheme.depositDeadline.getMonth()}/{contractInfo.scheme.depositDeadline.getDate()}
                <span> </span>
                {contractInfo.scheme.depositDeadline.getHours()}:{contractInfo.scheme.depositDeadline.getMinutes()}
              </p>
            </div>
          </div>
          <div>
            <h1 className="text-[#808191] pl-2">Status</h1>
            <p className="flex items-center h-[38px] bg-[#F5F5F8] justify-center rounded-[20px]">{contractInfo.statePlus.printResult}</p>
          </div>
          <div className="pt-4">
            {submitted ? (
              <Button
                disabled
                className="flex items-center h-[38px] rounded-[30px] w-full justify-center bg-[#9D78FF] hover:bg-[#9D78FF]/80   text-white"
              >
                Tx submitted
              </Button>
            ) : (
              contractInfo.choices.map((item) => (
                <Button
                  className="cursor-pointer flex items-center h-[38px] rounded-[30px] w-full justify-center bg-[#9D78FF] hover:bg-[#9D78FF]/80   text-white"
                  key={item.name}
                  disabled={loading}
                  onClick={() => applyContractInput(item)}
                >
                  {loading ? (
                    <div className="flex gap-x-3">
                      <span>Processing</span>
                      <Image className="animate-spin" src="/loader-circle.svg" alt="loading" height={20} width={20} />
                    </div>
                  ) : (
                    <h1>{item.name}</h1>
                  )}
                </Button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

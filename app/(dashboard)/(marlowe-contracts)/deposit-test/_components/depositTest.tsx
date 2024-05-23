"use client";

import { useForm } from "react-hook-form";
import { Party } from "@marlowe.io/language-core-v1";
import { AddressBech32, ContractId } from "@marlowe.io/runtime-core";
import { useState } from "react";
import {
  deposit_tag,
  mkDepositContract,
} from "@/marlowe-contracts-cli/src/contract-deposit/mk-deposit-contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

type State = "createContract" | "showContract";

export const DepositTest = () => {
  const { runtimeLifecycle, walletAddress } = useCardanoStore();
  const [contractId, setContractId] = useState<ContractId | undefined>(
    undefined
  );
  const [state, setState] = useState<State>("createContract");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const bech32Checker = async (value: string) => {
    const { C } = await import("lucid-cardano");
    try {
      C.Address.from_bech32(value);
      return true;
    } catch (e) {
      return false;
    }
  };

  const formSchema = z.object({
    amount: z
      .string()
      // .transform((value) => Number(value))
      .refine((value) => !isNaN(Number(value)) && Number(value) > 0, {
        message: "Amount must be a positive number",
      }),
    address: z.string().refine(bech32Checker, {
      message: "Invalid Bech32 address", // Custom error message
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      amount: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const amount = Number(values.amount);
    deploy(amount, values.address);
    console.log(values);
  };

  //deploying smart contract
  const deploy = async (amount: number, bob: string) => {
    if (walletAddress) {
      //initialize contract parameters
      try {
        setLoading(true);
        const amtLovelace = amount * 1000000;
        const aliceAddr = walletAddress as AddressBech32;
        const aliceBech32: Party = { address: aliceAddr };
        const bobAddress = bob as AddressBech32;
        const bobBech32: Party = { address: bobAddress };

        // build the Smart Contract
        const myContract = mkDepositContract(
          amtLovelace,
          aliceBech32,
          bobBech32
        );

        // deploy the Smart Contract and the await waits for submission
        const contractInstanceAPI =
          await runtimeLifecycle!.newContractAPI.create({
            contract: myContract,
            tags: deposit_tag,
          });
        console.log(`Contract Creation is: ${contractInstanceAPI.id}`);
        toast.success(
          "Your contract was created. Processing may take 10 to 30 seconds. Please wait..."
        );
        await contractInstanceAPI.waitForConfirmation();
        toast.success(
          "Your contract was successfully submitted to the blockchain"
        );
        setContractId(contractInstanceAPI.id);
        setLoading(false);
        form.reset();
      } catch (error) {
        setLoading(false);
        toast.error("Something went wrong.");
      }
    }
  };

  const depositTx = async () => {
    try {
      if (contractId && runtimeLifecycle) {
        setLoading(true);
        const contractInstanceAPI =
          await runtimeLifecycle.newContractAPI.load(contractId);
        const contractDetails = await contractInstanceAPI.getDetails();
        if (contractDetails.type === "active") {
          const [applicableAction] =
            await runtimeLifecycle.applicableActions.getApplicableActions(
              contractDetails
            );
          if (applicableAction.type !== "Choice") {
            const applicableInput =
              await runtimeLifecycle.applicableActions.getInput(
                contractDetails,
                applicableAction
              );
            const txId = await contractInstanceAPI.applyInput({
              input: applicableInput,
            });
            toast.success(
              "Your transaction was created. Processing may take 10 to 30 seconds. Please wait..."
            );
            await runtimeLifecycle.wallet.waitConfirmation(txId);
            console.log(`transaction submited ok ${txId}`);
            setLoading(false);
            setSubmitted(true);
            toast.success("Your transaction was successfully submitted.");
          }
        }
      }
    } catch (error) {
      setLoading(false);
      toast.error("Something went wrong.");
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Contract ID copied to clipboard!"); // Optionally notify the user
    } catch (err) {
      toast.error("Failed to copy contract id");
    }
  };

  return (
    <div className="relative w-full flex h-full justify-center">
      <div className="absolute flex w-[450px] space-x-14 top-16 text-[17px]">
        <button
          className={cn(
            "text-[#121216]",
            state === "createContract" && "text-[#9D78FF]"
          )}
          onClick={() => setState("createContract")}
        >
          <span>Create contract</span>
        </button>
        <button
          className={cn(
            "text-[#121216]",
            state === "showContract" && "text-[#9D78FF]"
          )}
          onClick={() => setState("showContract")}
        >
          <span>Show contracts</span>
        </button>
      </div>

      {state === "createContract" ? (
        <div className="mt-28 w-1/3 min-w-[480px] h-[calc(100%-110px)]">
          <div className="flex flex-col bg-white shadow-md p-8 rounded-[30px] text-[#121216] space-y-5">
            <div className="text-[22px]">Deposit test</div>
            <div className="text-[14px] text-[#808191] leading-snug">
              This is a smart contract that enables straightforward money
              transfer to your wallet.
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-[-2px] ">
                      <FormLabel className="text-[14px] font-normal pl-2">
                        Depositor address
                      </FormLabel>
                      <FormControl>
                        <Input
                          className=" rounded-xl border border-[#808191] bg-[#F5F5F8]"
                          disabled={loading}
                          placeholder="Enter a valid Bech32 address"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription></FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-[-2px] ">
                      <FormLabel className="text-[14px] font-normal pl-2">
                        Amount
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            className="rounded-xl border border-[#808191] bg-[#F5F5F8]"
                            disabled={loading}
                            placeholder="Enter amount in ADA"
                            {...field}
                          />
                          <span className="absolute inset-y-0 right-2 pr-3 flex items-center text-[14px] text-[#808191]">
                            ADA
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription></FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-center py-3">
                  {loading ? (
                    <Button
                      className="w-[350px] gap-x-3 rounded-3xl font-normal text-[15px] bg-[#9D78FF] hover:bg-[#9D78FF]/80 "
                      disabled={loading}
                      type="submit"
                    >
                      <span>Processing</span>
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
                      className="w-[350px] rounded-3xl font-normal text-[15px] bg-[#9D78FF] hover:bg-[#9D78FF]/80 "
                      disabled={loading}
                      type="submit"
                    >
                      Deploy Smart Contract
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      ) : (
        <div className="flex w-full  items-center justify-center">
          <div className="mt-28 w-1/3 min-w-[480px] h-[calc(100%-110px)]">
            <div className="flex flex-col bg-white shadow-md py-8 pr-8 pl-12 rounded-[30px]   h-4/5">
              <div className="text-[22px]">Deposit test / Contracts</div>
              {contractId ? (
                <>
                  <div className="grid grid-cols-2 mt-7 mb-2 text-[14px] text-[#808191] ">
                    <div>Contract ID</div>
                    <div className="text-center ">Status</div>
                  </div>
                  <div className="grid grid-cols-2 items-center justify-center mt-7 mb-2 text-[14px] text-[#121216]">
                    <div className="flex gap-x-2.5 items-center">
                      {`${contractId.substring(0, 6)}...${contractId.slice(-6)}`}
                      <Image
                        className="cursor-pointer"
                        src="/copy-purple.svg"
                        alt="Copy"
                        width={15}
                        height={15}
                        onClick={() => handleCopyToClipboard(contractId)}
                      />
                    </div>
                    <div className="flex justify-center">
                      {loading ? (
                        <button className="flex gap-x-2 h-[38px]  items-center text-[#808191]">
                          <span>processing</span>
                          <Image
                            className="animate-spin"
                            src="/loader-circle.svg"
                            alt="loading"
                            height={20}
                            width={20}
                          />
                        </button>
                      ) : submitted ? (
                        <button className="h-[38px] rounded-[20px] bg-[#ECEBF1] px-4 text-[#808191] cursor-default">
                          Deposited
                        </button>
                      ) : (
                        <Button
                          className="h-[38px] rounded-[20px] bg-[#9D78FF] hover:bg-[#9D78FF]/80 px-6 text-white"
                          onClick={depositTx}
                        >
                          Deposit
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col flex-grow space-y-4 items-center justify-center">
                  <Image
                    src="no-deposit.svg"
                    alt="no deposit"
                    height={90}
                    width={90}
                  />
                  <span className="text-[16px] text-[#808191]">
                    No deposits to show
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

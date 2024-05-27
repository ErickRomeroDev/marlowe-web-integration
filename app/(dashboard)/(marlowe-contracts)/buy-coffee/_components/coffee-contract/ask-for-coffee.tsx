"use client";

import { useState } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Party } from "@marlowe.io/language-core-v1";
import { AddressBech32 } from "@marlowe.io/runtime-core";
import {
  deposit_tag,
  mkDepositContract,
} from "@/marlowe-contracts-cli/src/contract-deposit/mk-deposit-contract";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export const AskForCoffee = () => {
  const { walletAddress, runtimeLifecycle } = useCardanoStore();
  const [loading, setLoading] = useState(false);

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
    const amount = Number(values.amount)
    deploy(amount, values.address);
    console.log(values);
  };

  //deploying smart contract
  const deploy = async (amount: number, sponsor: string) => {
    if (walletAddress) {
      try {
        setLoading(true);
        //initialize contract parameters
        const amtLovelace = amount * 1000000;
        const drinker = walletAddress as AddressBech32;
        const drinkerBech32: Party = { address: drinker };
        const sponsor_ = sponsor as AddressBech32;
        const sponsorBech32: Party = { address: sponsor_ };

        // build the Smart Contract
        const myContract = mkDepositContract(
          amtLovelace,
          sponsorBech32,
          drinkerBech32
        );

        // deploy the Smart Contract and the await waits for submission
        const contractInstanceAPI =
          await runtimeLifecycle!.newContractAPI.create({
            contract: myContract,
            tags: deposit_tag,
          });
        console.log(`Contract Creation is: ${contractInstanceAPI.id}`);
        toast.success("Your contract was created. Processing may take 10 to 30 seconds. Please wait...");
        await contractInstanceAPI.waitForConfirmation();
        toast.success("Your contract was successfully submitted to the blockchain");
        console.log(
          `Contract ${contractInstanceAPI.id} was submitted successfully to the blockchain`
        );
        setLoading(false);
        form.reset();
      } catch (error) {
        setLoading(false);
        toast.error("Something went wrong.")
      }
    }
  };

  return (
    <div className="flex flex-col bg-white shadow-md p-8 rounded-[30px] text-[#121216] space-y-5">
      <div className="text-[22px]">Buy me a coffee</div>
      <div className="text-[14px] text-[#808191] leading-snug">
        You can request sponsors to deposit a specific amount into your
        wallet—just like buying you a coffee!
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-[-2px] ">
                <FormLabel className="text-[14px] font-normal pl-2">
                  Sponsor address
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
  );
};

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { toast } from "sonner";

import { useCardanoStore } from "@/hooks/use-cardano-store";
import { AddressBech32 } from "@marlowe.io/runtime-core";
import { ProjectParameters } from "@/lib/contracts-ui/giftCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export const CreateContract = () => {
  const { walletAddress, runtimeLifecycle } = useCardanoStore();

  //initializing states
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentDate = new Date();
  const minDate = currentDate.toISOString().slice(0, 16);
  const [selectedDateTime, setSelectedDateTime] = useState(minDate);
  // Set the max date as two years from the current date
  currentDate.setFullYear(currentDate.getFullYear() + 2);
  const maxDate = currentDate.toISOString().slice(0, 16);

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
    beneficiary: z.string().refine(bech32Checker, {
      message: "Invalid Bech32 address", // Custom error message
    }),
    date: z.string(),
    address: z.string().refine(bech32Checker, {
      message: "Invalid Bech32 address", // Custom error message
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiary: "",
      address: "",
      amount: "",      
      date: minDate,
    },
  });

  const onSubmit2 = async (values: z.infer<typeof formSchema>) => {
    const amount = Number(values.amount);
    console.log("test")
    deploy(amount, values.address, values.date);
    console.log({ values });
  };

  //deploying smart contract
  const deploy = async (amount: number, VC: string, depositDeadline: string) => {
    const { mkSourceMap } = await import("@/lib/contracts-ui/experimental-features/source-map");
    const { mkContract } = await import("@/lib/contracts-ui/giftCard");
    if (walletAddress && runtimeLifecycle) {
      try {
        setLoading(true);
        //initialize contract parameters
        // 2024-05-27T22:18:30-03:00
        const schema: ProjectParameters = {
          creator: walletAddress as AddressBech32,
          creationTime: new Date(depositDeadline),
          amount: amount * 1000000,
          payee: walletAddress as AddressBech32,
          payer: VC as AddressBech32,
          depositDeadline: new Date(depositDeadline),
          beneficiaryName: "beneficiary",
        };
        console.log("before creation")
        const contractInstance = await mkContract(schema, runtimeLifecycle)

        console.log(`Contract created with id ${contractInstance.id}`);
        toast.success("Your contract was created. Processing may take 10 to 30 seconds. Please wait...");

        // this is another option to wait for a tx when using the instance of the contract
        await contractInstance.waitForConfirmation();
        //   await waitIndicator(lifecycleNami.wallet, contractIdToTxId(contractInstance.id));
        toast.success("Your contract was successfully submitted to the blockchain");
        setLoading(false);
        form.reset();
        console.log(`Contract id ${contractInstance.id} was successfully submited to the blockchain`);
      } catch (error) {
        setLoading(false);
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <div className="flex flex-col bg-white shadow-md p-8 rounded-[30px] text-[#121216] space-y-5">
      <div className="text-[22px]">Fund my project</div>
      <div className="text-[14px] text-[#808191] leading-snug">
        You can invite supporters to contribute a specified amount to your project—just like backing your vision!
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit2)} className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-[-2px] ">
                <FormLabel className="text-[14px] font-normal pl-2">Sponsor address</FormLabel>
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
          <div className="grid grid-cols-2 gap-x-6">
            <FormField
              control={form.control}
              name="beneficiary"
              render={({ field }) => (
                <FormItem className="space-y-[-2px] ">
                  <FormLabel className="text-[14px] font-normal pl-2">Beneficiary</FormLabel>
                  <FormControl>
                    <Input
                      className=" rounded-xl border border-[#808191] bg-[#F5F5F8]"
                      disabled={loading}
                      placeholder="Enter a valid beneficiary Address"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-[-2px] ">
                  <FormLabel className="text-[14px] font-normal pl-2">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="rounded-xl border border-[#808191] bg-[#F5F5F8]"
                        disabled={loading}
                        placeholder="Enter amount in ADA"
                        {...field}
                      />
                      <span className="absolute inset-y-0 right-2 pr-3 flex items-center text-[14px] text-[#808191]">ADA</span>
                    </div>
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="space-y-[-2px] ">
                  <FormLabel className="text-[14px] font-normal pl-2">Final date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      min={minDate}
                      max={maxDate}
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
          </div>
          <div className="flex justify-center pt-5 pb-3">
            {loading ? (
              <Button
                className="w-[350px] gap-x-3 rounded-3xl font-normal text-[15px] bg-[#9D78FF] hover:bg-[#9D78FF]/80 "
                disabled={loading}
                type="submit"                
              >
                <span>Processing</span>
                <Image className="animate-spin" src="/loader-circle.svg" alt="loading" height={20} width={20} />
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

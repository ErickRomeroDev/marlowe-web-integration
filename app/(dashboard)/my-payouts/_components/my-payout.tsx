"use client";

import { useState } from "react";
import {
  PolicyId,
  ContractId,
  PayoutId,
  WithdrawalId,
} from "@marlowe.io/runtime-core";

import { cn } from "@/lib/utils";
import { AvailablePayouts } from "./available-payouts";
import { WithdrawnPayouts } from "./withdrawn-payouts";

export type State = "available" | "withdrawn";

export type WithdrawnPayoutsType = {
  assets: {
    tokens: {
      quantity: bigint;
      assetId: { policyId: PolicyId; assetName: string };
    }[];
  } & {
    lovelaces?: bigint;
  };
  contractId: ContractId;
  payoutId: PayoutId;
  role: { policyId: PolicyId; assetName: string };
  withdrawalId: WithdrawalId;
}[];

export type AvailablePayoutsType = {
  assets: {
    tokens: {
      quantity: bigint;
      assetId: { policyId: PolicyId; assetName: string };
    }[];
  } & {
    lovelaces?: bigint;
  };
  contractId: ContractId;
  payoutId: PayoutId;
  role: { policyId: PolicyId; assetName: string };
}[];

export const MyPayout = () => {
  const [state, setState] = useState<State>("available");

  return (
    <>
      <div className="hidden lg:flex relative w-full h-full justify-center">
        <div className="absolute flex w-full justify-center space-x-14 top-4 text-[17px]">
          <button
            className={cn(
              "text-[#121216]",
              state === "available" && "text-[#9D78FF]"
            )}
            onClick={() => setState("available")}
          >
            Available
          </button>
          <button
            className={cn(
              "text-[#121216]",
              state === "withdrawn" && "text-[#9D78FF]"
            )}
            onClick={() => setState("withdrawn")}
          >
            Withdrawn
          </button>
        </div>
        <div className=" flex flex-col w-full items-center">
          <div className="w-full h-full flex justify-center">
            <>{state === "available" && <AvailablePayouts />}</>
            <>{state === "withdrawn" && <WithdrawnPayouts />}</>
          </div>
        </div>
      </div>
    </>
  );
};

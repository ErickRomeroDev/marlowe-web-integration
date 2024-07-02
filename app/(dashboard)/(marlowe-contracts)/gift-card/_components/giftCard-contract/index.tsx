"use client";

import { useState } from "react";
import { CreateContract } from "./create-contract";
import { MyActiveContracts } from "./myActive-contracts";
import { LoadContract } from "./load-contract";
import { cn } from "@/lib/utils";

export const GiftCardContract = () => {
  type State = "createContract" | "myActiveContracts" | "loadContract";
  const [state, setState] = useState<State>("createContract");
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
          Create Contract
        </button>
        <button
          className={cn(
            "text-[#121216]",
            state === "myActiveContracts" && "text-[#9D78FF]"
          )}
          onClick={() => setState("myActiveContracts")}
        >
          My contracts
        </button>
        <button
          className={cn(
            "text-[#121216]",
            state === "loadContract" && "text-[#9D78FF]"
          )}
          onClick={() => setState("loadContract")}
        >
          Load Contract
        </button>
      </div>
      <div className=" flex flex-col w-full items-center">
        <div className="mt-28 w-1/3 min-w-[580px] h-[calc(100%-110px)] flex justify-center">
          <div>{state === "createContract" && <CreateContract />}</div>
          <div>{state === "myActiveContracts" && <MyActiveContracts />}</div>
          <div>{state === "loadContract" && <LoadContract />}</div>
        </div>
      </div>
    </div>
  );
};

"use client";

import { useState } from "react";
import { AskForCoffee } from "./ask-for-coffee";
import { CoffeesToFund } from "./coffees-to-fund";
import { cn } from "@/lib/utils";

export const CoffeeContract = () => {
  type State = "createContract" | "showContract";
  const [state, setState] = useState<State>("createContract");
  return (
    <div className="relative w-full flex h-full justify-center  ">
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
      <div className=" flex flex-col w-full items-center">
        <div className="mt-28 w-1/3 min-w-[480px] h-[calc(100%-110px)]">
          {state === "createContract" ? <AskForCoffee /> : <CoffeesToFund />}
        </div>
      </div>
    </div>
  );
};

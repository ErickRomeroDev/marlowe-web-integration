"use client";

import { useState } from "react";
import { AskForCoffee } from "./ask-for-coffee";
import { CoffeesToFund } from "./coffees-to-fund";

export const CoffeeContract = () => {
  type State = "createContract" | "showContract";
  const [state, setState] = useState<State>("createContract");
  return (
    <div>
      <div>
        <button onClick={() => setState("createContract")}>
          Create contract
        </button>
        <button onClick={() => setState("showContract")}>Show contract</button>
      </div>
      <div>
        {state === "createContract" ? <AskForCoffee /> : <CoffeesToFund />}
      </div>
    </div>
  );
};

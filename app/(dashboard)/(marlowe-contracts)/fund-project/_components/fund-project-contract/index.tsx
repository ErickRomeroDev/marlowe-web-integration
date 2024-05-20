"use client";

import { useState } from "react";
import { CreateContract } from "./create-contract";
import { MyActiveContracts } from "./myActive-contracts";
import { LoadContract } from "./load-contract";

export const FundMyProjectContract = () => {
  type State = "createContract" | "myActiveContracts" | "loadContract";
  const [state, setState] = useState<State>("createContract");
  return (
    <div>
      <div className="space-x-3">
        <button onClick={() => setState("createContract")}>Create Contract</button>
        <button onClick={() => setState("myActiveContracts")}>See my active contracts</button>
        <button onClick={() => setState("loadContract")}>Load Contract</button>
      </div>
      <div>{state === "createContract" && <CreateContract /> }</div>
      <div>{state === "myActiveContracts" && <MyActiveContracts /> }</div>
      <div>{state === "loadContract" && <LoadContract /> }</div>
    </div>
  );
};

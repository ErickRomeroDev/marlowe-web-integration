"use client";

import { useState } from "react";
import { RequestFunding } from "./request-funding";
import { ProvideFunding } from "./provide-funding";

export const FundMyProjectContract = () => {
  type State = "requestFunding" | "provideFunding";
  const [state, setState] = useState<State>("requestFunding");
  return (
    <div>
      <div>
        <button onClick={() => setState("requestFunding")}>Request Funding</button>
        <button onClick={() => setState("provideFunding")}>Provide Funding</button>
      </div>
      <div>{state === "requestFunding" ? <RequestFunding /> : <ProvideFunding />}</div>
    </div>
  );
};

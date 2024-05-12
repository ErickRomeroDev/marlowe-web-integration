"use client";

import { useEffect } from "react";

export const ClientTesting = () => {
  useEffect(() => {
    const initialize = async () => {
      const { mkRestClient } = await import("@marlowe.io/runtime-rest-client");
      const restClient = mkRestClient(process.env.NEXT_PUBLIC_RUNTIME_PREPROD_INSTANCE!);
      console.log(restClient);
    };
    initialize();
  }, []);

  return <div>Client Testing</div>;
};

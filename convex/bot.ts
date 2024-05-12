"use node";

import { action } from "./_generated/server";
import { Blockfrost, Lucid } from "lucid-cardano";
import { mkRestClient } from "@marlowe.io/runtime-rest-client";

export const doSomething = action({
  handler: async () => {
    const lucid = await Lucid.new(
      new Blockfrost(
        "https://cardano-preprod.blockfrost.io/api/v0",
        process.env.BLOCKFROST_API
      ),
      "Preprod"
    );
    const seed = lucid.utils.generateSeedPhrase();
    console.log(seed);
    lucid.selectWalletFromSeed(seed);
    const address = await lucid.wallet.address();
    console.log(address)
  },
});

export const testMarlowe = action({
  handler: async () => {
    const restClient = mkRestClient(process.env.NEXT_PUBLIC_RUNTIME_PREPROD_INSTANCE!);
    console.log(restClient)
    const isHealthy = await restClient.healthcheck();
    console.log(isHealthy)
  }
})

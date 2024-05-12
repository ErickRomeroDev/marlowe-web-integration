import Link from "next/link";
import { getCookies } from "@/lib/get-cookies";
import { mkRestClient } from "@marlowe.io/runtime-rest-client";

export default async function Home() {
  const { address, walletName, network, balance } = getCookies("walletInfo");
  const restClient = mkRestClient(process.env.NEXT_PUBLIC_RUNTIME_PREPROD_INSTANCE!);
  console.log(restClient)
  // const isHealthy = await restClient.healthcheck();
  // console.log(isHealthy);

  return (
    <div className="flex flex-col">
      {/* <div className="font-bold">This are the contracts available:</div>
      <Link href="/deposit-test" className="cursor-pointer">
        Deposit Test
      </Link>
      <Link href="/buy-coffee" className="cursor-pointer">
        Buy me a coffee
      </Link> */}
      Status of the wallet from the server: {address ? `connected: ${address}` : "disconnected"}      
    </div>
  );
}

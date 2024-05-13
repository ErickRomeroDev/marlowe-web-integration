import Link from "next/link";
import { getCookies } from "@/lib/get-cookies";

export default async function Home() {
  const { address, walletName, network, balance } = getCookies("walletInfo");

  return (
    <div className="flex flex-col">
      <div className="font-bold">This are the contracts available:</div>
      <Link href="/marloweContracts/deposit-test" className="cursor-pointer">
        Deposit Test
      </Link>
      <Link href="/marloweContracts/buy-coffee" className="cursor-pointer">
        Buy me a coffee
      </Link>
      Status of the wallet from the server: {address ? `connected: ${address}` : "disconnected"}      
    </div>
  );
}

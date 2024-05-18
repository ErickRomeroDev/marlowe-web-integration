import Link from "next/link";
import { getCookies } from "@/lib/get-cookies";

export default async function Home() {
  const { address, walletName, network, balance } = getCookies("walletInfo");

  return (
    <div className="py-4">
      <div className="space-y-1 flex flex-col">
        <div className="font-bold">Contracts available ({address ? "connected" : "disconnected"}):</div>
        <Link href="/marloweContracts/deposit-test" className="cursor-pointer">
          1. Deposit Test
        </Link>
        <Link href="/marloweContracts/buy-coffee" className="cursor-pointer">
          2. Buy me a coffee
        </Link>
      </div>        
    </div>
  );
}

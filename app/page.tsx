import { WalletSelect } from "@/components/wallet-select";
import CardanoClientOnly from "@/providers/cardano-client-provider";
import ClientOnly from "@/providers/cardano-client-provider";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      <div className="font-bold">This are the contracts available:</div>
      <Link href="/deposit-test" className="cursor-pointer">
        Deposit Test
      </Link>
      <Link href="/buy-coffee" className="cursor-pointer">
        Buy me a coffee
      </Link>

      <WalletSelect />
    </div>
  );
}

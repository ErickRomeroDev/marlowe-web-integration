
import { getCookies } from "@/lib/get-cookies";
import Image from "next/image";

export default async function Home() {
  const { address, walletName, network, balance } = getCookies("walletInfo");

  return (
    <div className="p-4 flex flex-col h-[calc(100%-100px)] items-center justify-center  space-y-8">
      <Image 
      src="/select-contract.svg"
      alt="select"
      height={180}
      width={180}
      />
      <span className="text-[#808191]">Please select a contract to continue.</span>    
    </div>
  );
}

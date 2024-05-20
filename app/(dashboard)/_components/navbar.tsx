import { WalletWidget } from "@/components/wallet-widget";
import Image from "next/image";

export const Navbar = () => {
  return (
    <div className="flex items-center gap-x-8 p-5">
      <div className="hidden lg:flex lg:flex-1 justify-end">
        <button className="flex gap-x-2">
            <Image 
            src="/file-text.svg"
            alt="File"
            width={20}
            height={20}
            />
        <h1 className="text-[#121216]">Documentation</h1>
        </button>
      </div>
      <WalletWidget />
    </div>
  );
};

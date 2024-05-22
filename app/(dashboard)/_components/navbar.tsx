import { WalletWidget } from "@/components/wallet-widget";
import Image from "next/image";
import Link from "next/link";

export const Navbar = () => {
  return (
    <div className="flex items-center gap-x-8 p-5">
      <div className="hidden lg:flex lg:flex-1 justify-end">
        <Link
          href="https://github.com/Erickrs2/marlowe-web-integration/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="flex gap-x-2">
            <Image src="/file-text.svg" alt="File" width={20} height={20} />

            <h1 className="text-[#121216]">Documentation</h1>
          </button>
        </Link>
      </div>
      <WalletWidget />
    </div>
  );
};

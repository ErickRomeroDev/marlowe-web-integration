import { getCookies } from "@/lib/get-cookies";
import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { NoWallet } from "@/components/no-wallet";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { address } = getCookies("walletInfo");

  return (
    <main className="h-full bg-[#F5F5F8]">
      {/* Desktop Content */}
      <div className="hidden md:block h-full">
        <Sidebar />
        <div className="pl-[230px] h-full flex ">
          <div className="h-full flex-1">
            <Navbar />
            {address ? (
              <>{children}</>
            ) : (
              <div className="h-[calc(100%-88px)]">
                <NoWallet />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile and Tablet Message */}
      <div className="bg-white h-full mt-20 md:hidden">
        <div className="text-start flex flex-col items-center p-4 space-y-4 pt-10">
          <Image src="monitor.svg" alt="desktop" height={120} width={120} />
          <h1 className="font-medium text-[17px] text-[#121216]">
            Desktop Mode Required
          </h1>
          <p className="text-start text-[#808191] max-w-[500px] pt-5 px-3">
            Thank you for visiting! Currently, our platform is only available on
            desktop. We are actively working to extend support to tablets and
            mobile devices soon. Stay tuned for updates and thank you for your
            patience!
          </p>
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;

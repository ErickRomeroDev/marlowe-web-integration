import { getCookies } from "@/lib/get-cookies";
import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { NoWallet } from "@/components/no-wallet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const {address} = getCookies("walletInfo")
  return (
    
    <main className="h-full bg-[#F5F5F8]">
      <Sidebar />
      <div className="pl-[230px] h-full flex ">
        <div className="h-full flex-1">
          <Navbar />
          {address ? <>{children}</> : 
          <div className="h-[calc(100%-88px)]">
            <NoWallet />
          </div>
          }
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;

import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <main className="h-full bg-[#F5F5F8]">
      <Sidebar />
      <div className="pl-[230px] h-full flex ">
        <div className="h-full flex-1">
          <Navbar />
          {children}
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;

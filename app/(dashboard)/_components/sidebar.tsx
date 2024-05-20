import Link from "next/link";
import { SidebarButton, SidebarButtonProps } from "./sidebar-button";

export const Sidebar = () => {
  const buttons: SidebarButtonProps[] = [
    { label: "Deposit test", imageSrc: "/unplug.svg", href: "/deposit-test" },

    { label: "Deposit test", imageSrc: "/unplug.svg", href: "/deposit-test" },
  ];

  return (
    <aside className="fixed z-[1] left-0 bg-white h-full w-[220px] rounded-[30px] flex p-3 flex-col gap-y-4 text-[#121216]">
      <div>
        {buttons.map((button) => (
          <SidebarButton
            key={button.label}
            label={button.label}
            imageSrc={button.imageSrc}
            href={button.href}
          />
        ))}
      </div>
      {/* <div className="py-4">
        <div className="space-y-1 flex flex-col">
          <div className="font-bold">
            Contracts available
          </div>
          <Link
            href="/deposit-test"
            className="cursor-pointer"
          >
            1. Deposit Test
          </Link>
          <Link href="/buy-coffee" className="cursor-pointer">
            2. Buy me a coffee
          </Link>
          <Link href="/fund-project" className="cursor-pointer">
            3. Fund my project
          </Link>
        </div>
      </div> */}
    </aside>
  );
};

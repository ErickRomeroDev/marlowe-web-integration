"use client";

import Link from "next/link";
import { SidebarButton, SidebarButtonProps } from "./sidebar-button";
import Image from "next/image";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();
  const buttons: SidebarButtonProps[] = [
    {
      label: "Deposit test",
      imageSrc: ["/deposit-white.svg", "/deposit.svg"],
      href: "/deposit-test",
      currentUrl: pathname,
    },

    {
      label: "Buy me a coffee",
      imageSrc: ["/coffee-white.svg", "/coffee.svg"],
      href: "/buy-coffee",
      currentUrl: pathname,
    },

    {
      label: "Fund my project",
      imageSrc: ["/fund-me-white.svg", "/fund-me.svg"],
      href: "/fund-project",
      currentUrl: pathname,
    },
    {
      label: "GiftCard",
      imageSrc: ["/fund-me-white.svg", "/fund-me.svg"],
      href: "/gift-card",
      currentUrl: pathname,
    },
    {
      label: "Vesting",
      imageSrc: ["/fund-me-white.svg", "/fund-me.svg"],
      href: "/vesting",
      currentUrl: pathname,
    },
    {
      label: "Escrow",
      imageSrc: ["/fund-me-white.svg", "/fund-me.svg"],
      href: "/escrow",
      currentUrl: pathname,
    },
    {
      label: "Payment Splitter",
      imageSrc: ["/fund-me-white.svg", "/fund-me.svg"],
      href: "/paymentSplitter",
      currentUrl: pathname,
    },
    {
      label: "Payouts",
      imageSrc: ["/fund-me-white.svg", "/fund-me.svg"],
      href: "/my-payouts",
      currentUrl: pathname,
    },
  ];

  return (
    <div className="fixed inset-0 flex items-center h-full w-[218px]">
      <aside className="fixed flex z-[1] left-3 h-[calc(100%-24px)] w-[218px] drop-shadow-lg bg-white  rounded-[30px] pl-5 pr-4 py-8 flex-col justify-between">
        <Link href="/">
          <div className="flex items-center justify-center">
            <Image
              src="/logo-placeholder.svg"
              alt="Logo"
              height={40}
              width={40}
            />
          </div>
        </Link>
        <ul className="flex flex-col space-y-3">
          {buttons.map((button) => (
            <SidebarButton
              key={button.label}
              label={button.label}
              imageSrc={button.imageSrc}
              href={button.href}
              currentUrl={button.currentUrl}
            />
          ))}
        </ul>
        <div className=" flex justify-center items-center gap-x-3">
          <Link
            href="https://discord.gg/xURSwbSqrG"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="cursor-pointer"
              src="/discord-logo-black.svg"
              alt="Discord"
              height={25}
              width={25}
            />
          </Link>

          <Link
            href="https://twitter.com/ErickRomeroEdda"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="cursor-pointer"
              src="/x-logo.svg"
              alt="Discord"
              height={19}
              width={19}
            />
          </Link>

          <Link
            href="https://github.com/Erickrs2/marlowe-web-integration"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="cursor-pointer"
              src="/github-mark.svg"
              alt="Discord"
              height={22}
              width={22}
            />
          </Link>
        </div>
      </aside>
    </div>
  );
};

import Link from "next/link";

export const Sidebar = () => {
  return (
    <aside className="fixed z-[1] left-0 bg-white h-full w-[220px] rounded-[30px] flex p-3 flex-col gap-y-4 text-[#121216]">
      <div className="py-4">
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
      </div>
    </aside>
  );
};

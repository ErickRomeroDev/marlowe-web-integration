import { walletsSupported } from "@/constants/wallets-supported";

export const WalletsSupported = () => {
  return (
    <div className="flex flex-col space-y-1 font-normal p-1">
      <p className="">Wallets supported:</p>
      <ul className="pl-2">
        {walletsSupported.map((wallet) => (
          <li key={wallet}>{wallet}</li>
        ))}
      </ul>
    </div>
  );
};

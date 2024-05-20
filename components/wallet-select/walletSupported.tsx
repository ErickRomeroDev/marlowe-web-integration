import { walletsSupported } from "@/constants/wallets-supported";

export const WalletsSupported = () => {
  return (
    <div>
      <p className="text-m-disabled lg:text-lg">Wallets supported:</p>
      <ul className="list-inside text-base text-m-disabled lg:text-lg">
        {walletsSupported.map((wallet) => (
          <li key={wallet}>{wallet}</li>
        ))}
      </ul>
    </div>
  );
};

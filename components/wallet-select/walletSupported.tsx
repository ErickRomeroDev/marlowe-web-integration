import { walletsSupported } from "@/constants/wallets-supported";

export const WalletsSupported = () => {
  return (
    <>
      <p className="font-bold text-m-disabled lg:text-lg">Wallets supported:</p>
      <ul className="list-inside list-disc text-base text-m-disabled lg:text-lg">
        {walletsSupported.map((wallet) => (
          <li key={wallet}>{wallet}</li>
        ))}
      </ul>
    </>
  );
};

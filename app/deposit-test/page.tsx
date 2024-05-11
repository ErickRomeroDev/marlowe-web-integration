import { getCookies } from "@/lib/get-cookies";
import { DepositTest } from "./_components/depositTest";

const Deposit = () => {
  const { address, walletName, network, balance } = getCookies("walletInfo");
  return (
    <>
      <DepositTest />
      Address: {address}
    </>
  );
};

export default Deposit;

import { EscrowContract } from "./_components/escrow-contract";

const Escrow = () => {
  return (
    <div className="flex lg:h-[calc(100%-88px)] h-full p-5 lg:p-0 justify-center">
      <EscrowContract />
    </div>
  );
};

export default Escrow;

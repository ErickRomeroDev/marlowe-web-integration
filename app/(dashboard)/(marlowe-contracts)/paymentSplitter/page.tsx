import { PaymentSplitterContract } from "./_components/paymentSplitter-contract";

const PaymentSplitter = () => {
  return (
    <div className="flex h-[calc(100%-88px)] p-4">
      <PaymentSplitterContract />
    </div>
  );
};

export default PaymentSplitter;

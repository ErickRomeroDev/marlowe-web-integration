import { FundMyProjectActions } from "@/lib/contracts-ui/fund-my-project";
import { ContractInfo } from "./load-contract";
import { useCardanoStore } from "@/hooks/use-cardano-store";

interface ContractInfoPlusInterface {
  contractInfo: ContractInfo | undefined;
}

export const ContractInfoPlus = ({ contractInfo }: ContractInfoPlusInterface) => {
  const { runtimeLifecycle } = useCardanoStore();

  const applyContractInput = async (action: FundMyProjectActions[number]) => {
    if (runtimeLifecycle && contractInfo) {
      switch (action.value.type) {
        case "check-state":
          return console.log("check state");
        case "return":
          return;
        case "Advance":
        case "Deposit":
          console.log("Applying input");
          const applicableInput = await contractInfo.applicableActions.toInput(action.value);
          const txId = await contractInfo.applicableActions.apply({
            input: applicableInput,
          });
          console.log(`Input applied with txId ${txId}`);
          await runtimeLifecycle.wallet.waitConfirmation(txId);
          console.log(`Input applied with txId ${txId} submitted to the blockchain`);
      }
    }
  };

  return (
    <div className="space-y-4">
      {contractInfo?.choices.map((item) => (
        <div key={item.name} onClick={() => applyContractInput(item)}>
          <div>{item.name}</div>
          <div>{item.description}</div>
        </div>
      ))}
    </div>
  );
};

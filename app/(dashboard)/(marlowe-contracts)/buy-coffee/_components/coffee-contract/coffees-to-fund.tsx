"use client";

import { ContractId, AddressBech32 } from "@marlowe.io/runtime-core";
import { useEffect, useState } from "react";
import { delay } from "@/lib/utils";
import { ApplicableInput, ApplyApplicableInputRequest } from "@marlowe.io/runtime-lifecycle/api";
import { useCardanoStore } from "@/hooks/use-cardano-store";
import { ContractHeader, GetContractsRequest } from "@marlowe.io/runtime-rest-client/contract";

type ContractInfo = {
  contractHeader: ContractHeader;
  deposit: ApplicableInput | null;
  deposited: boolean;
};

export const CoffeesToFund = () => {
  const { restAPI, runtimeLifecycle, walletAddress } = useCardanoStore();

  //initializing states
  const [contractInfos, setContractInfos] = useState<ContractInfo[]>([]);

  //get contract Info
  useEffect(() => {
    const shouldUpdateRef = { current: true };
    const run = async () => {
      if (walletAddress && restAPI && runtimeLifecycle) {
        let tags_array = ["buy-me-a-coffee-sponsor"];
        const contractsRequest: GetContractsRequest = {
          tags: tags_array,
          partyAddresses: [walletAddress as AddressBech32],
        };
        const contractHeaders = await restAPI.getContracts(contractsRequest);
        console.log({ contractHeaders });

        const contractInfosTemp = await Promise.all(
          contractHeaders.contracts.map(async (contractHeader: ContractHeader) => {
            const contractInstanceAPI = await runtimeLifecycle.newContractAPI.load(contractHeader.contractId);
            const contractDetails = await contractInstanceAPI.getDetails();
            console.log({ contractDetails });
            const applicableActions = await runtimeLifecycle.applicableActions.getApplicableActions(contractDetails);
            console.log({ applicableActions });
            if (applicableActions.length > 0 && contractDetails.type === "active" && applicableActions[0].type !== "Choice") {
              const applicableInput = await runtimeLifecycle.applicableActions.getInput(contractDetails, applicableActions[0]);
              return {
                contractHeader,
                deposit: applicableInput,
                deposited: false,
              };
            } else {
              return { contractHeader, deposit: null, deposited: true };
            }
          })
        );
        setContractInfos(contractInfosTemp);
        console.log({ contractInfosTemp });
      }
      await delay(3000);
      if (shouldUpdateRef.current) {
        run();
      }
    };
    run();
    return () => {
      shouldUpdateRef.current = false;
    };
  }, [walletAddress, restAPI, runtimeLifecycle]);

  const depositButton = (deposit: ApplicableInput | null, deposited: boolean, contractHeader: ContractHeader): JSX.Element => {
    if (deposited) {
      return <span>Already funded</span>;
    }
    if (deposit !== null) {
      return <DepositButton contractId={contractHeader.contractId} deposit={deposit} />;
    }
    return <span>Awaiting deposit from the other side</span>;
  };

  return (
    <div className="">
      <div className="py-4 font-bold">Sponsor:</div>
      {contractInfos.length === 0 ? (
        <p>No coffees to fund {contractInfos.length}</p>
      ) : (
        <ul>
          {contractInfos.map(({ contractHeader, deposit, deposited }, index) => (
            <li key={index}>
              {contractHeader.contractId} | {depositButton(deposit, deposited, contractHeader)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type DepositButtonProps = {
  contractId: ContractId;
  deposit: ApplicableInput | null;
};

const DepositButton: React.FC<DepositButtonProps> = ({ contractId, deposit }) => {
  const { runtimeLifecycle } = useCardanoStore();

  const [submitted, setSubmitted] = useState<boolean | string>(false);

  if (deposit && runtimeLifecycle) {
    if (!submitted) {
      const go = async function () {
        const applyApplicableInput: ApplyApplicableInputRequest = { input: deposit };

        await runtimeLifecycle.applicableActions.applyInput(contractId, applyApplicableInput);
        setSubmitted(true);
      };
      return <button onClick={() => go()}>Deposit</button>;
    } else {
      return <span>Deposited</span>;
    }
  } else {
    return <span>Already funded</span>;
  }
};

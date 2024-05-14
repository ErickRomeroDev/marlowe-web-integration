"use client";

import {
  Input,
  IDeposit,
  Environment,
  datetoTimeout,
} from "@marlowe.io/language-core-v1";
import { Deposit } from "@marlowe.io/language-core-v1/next";
import { ContractId } from "@marlowe.io/runtime-core";
import { useEffect, useState } from "react";
import { delay} from "@/lib/utils";
import { ApplyInputsRequest } from "@marlowe.io/runtime-lifecycle/api";
import * as Contract from "@marlowe.io/runtime-rest-client/contract";
import { useCardanoStore } from "@/hooks/use-cardano-store";

type ContractInfo = {
  contractHeader: Contract.ContractHeader;
  deposit: IDeposit | null;
  deposited: boolean;
};

export const CoffeesToFund = () => {
  const { restAPI } = useCardanoStore();

  //initializing states  
  const [amount, setAmount] = useState<bigint | undefined>(undefined);  
  const [contractInfos, setContractInfos] = useState<ContractInfo[]>([]);  

  //get contract Info
  useEffect(() => {
    const shouldUpdateRef = { current: true };
    const run = async () => {  

        const contractsRequest: Contract.GetContractsRequest = {
          tags: ["buy-me-a-coffee-sponsor"],
          partyAddresses: walletAddresses,
        };

        const contractHeaders = await restAPI.getContracts(contractsRequest);
                
        const contractInfos = await Promise.all(
          contractHeaders.contracts.map(
            async (contractHeader: Contract.ContractHeader) => {
              const now = datetoTimeout(new Date(Date.now()));
              const tenMinutesInMilliseconds = 10 * 60 * 1000;
              const inTenMinutes = datetoTimeout(
                new Date(Date.now() + tenMinutesInMilliseconds)
              );
              const env: Environment = {
                timeInterval: { from: now, to: inTenMinutes },
              };

              const response =
                await runtimeLifecycle.contracts.getApplicableInputs(
                  contractHeader.contractId,
                  env
                );                
                
              if (response.applicable_inputs.deposits.length > 0) {
                const depositInfo = response.applicable_inputs.deposits[0];
                
                // swap party and into_account (BUG of SDK)
                const intoAccountTemp = depositInfo.party;
                const partyTemp = depositInfo.into_account;
                depositInfo.party = partyTemp;
                depositInfo.into_account = intoAccountTemp;
                ///////////////////////////////////////////
                
                return {
                  contractHeader,
                  deposit: Deposit.toInput(depositInfo),
                  deposited: false,
                };
              } else {
                return { contractHeader, deposit: null, deposited: true };
              }
            }
          )
        );
        setContractInfos(contractInfos);
        await delay(3000000);
        if (shouldUpdateRef.current) {
          run();
        }
      }
    
    run();
    return () => {
      shouldUpdateRef.current = false;
    };
  }, [wallet]);

   //handling wallet connection
  const handleConnection = async (walletName: any) => {
    if (wallet === undefined) {
      const { mkBrowserWallet } = await import("@marlowe.io/wallet");
      const walletApi = await mkBrowserWallet(walletName);
      const lovelace = await walletApi.getLovelaces();
      setAmount(lovelace);
      setWallet(walletName);
    } else {
      setWallet(undefined);
      setAmount(undefined);
    }
  };

  const depositButton = (deposit: IDeposit | null, deposited: boolean, contractHeader: Contract.ContractHeader): JSX.Element => {
    if(deposited) {
      return <span>Already funded</span>
    }
    if(deposit !== null) {
      return <DepositButton contractId={contractHeader.contractId} deposit={deposit} wallet={wallet!} />
    }
    return <span>Awaiting deposit from the other side</span>
  }

  return (
    <div className="">
      <div>Sponsor:</div> 

      {contractInfos.length === 0 ? (
        <p>No coffees to fund</p>
      ) : (
        <ul>
          {contractInfos.map(
            ({ contractHeader, deposit, deposited }, index) => (
              <li key={index}>{contractHeader.contractId} | {depositButton(deposit, deposited, contractHeader)}</li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

type DepositButtonProps = {  
  contractId: ContractId,
  deposit: IDeposit | null,
  wallet: SupportedWalletName
}

const DepositButton:React.FC<DepositButtonProps> = ({ contractId, deposit, wallet }) => {  
  // ApplyInputsRequest: {
  //     inputs: Input[];
  //     invalidBefore?: ISO8601;
  //     invalidHereafter?: ISO8601;
  //     metadata?: Metadata;
  //     tags?: Tags;
  // }
  const [submitted, setSubmitted] = useState<boolean | string>(false);
  // We want to display button to deposit if there is no deposit
  
  if(deposit) {
    if(!submitted) {
      const go = async function() {
        // connect to runtime instance
        const { mkRuntimeLifecycle } = await import(
          "@marlowe.io/runtime-lifecycle/browser"
        );
        const runtimeLifecycle = await mkRuntimeLifecycle({
          walletName: wallet!,
          runtimeURL: runtimeServerURL,
        });
        const depositTemp: IDeposit = deposit;
        const inputs: Input[] = [depositTemp]
        const depositRequest: ApplyInputsRequest = {
          inputs: inputs
        };             
        const res = await runtimeLifecycle.contracts.applyInputs(contractId, depositRequest);        
        setSubmitted(true)
      }
      return <button onClick={() => go()}>Deposit</button>
    } else {
      return <span>Deposited</span>
    }
  } else {
    return <span>Already funded</span>
  }
}



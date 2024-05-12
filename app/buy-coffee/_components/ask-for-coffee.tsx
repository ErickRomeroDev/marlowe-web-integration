"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { walletsSupported } from "@/constants/wallets-supported";
import {
  Party,    
} from "@marlowe.io/language-core-v1";
import { AddressBech32 } from "@marlowe.io/runtime-core";
import {
  BroswerWalletExtension,
  SupportedWalletName,
} from "@marlowe.io/wallet/browser";
import { useEffect, useState } from "react";
import {
  DEPOSIT_TAG,
  mkDepositContract,
} from "@/marlowe-contracts/mk-deposit-contract";
import { parseADA } from "@/lib/utils";
import {
  CreateContractRequest,
} from "@marlowe.io/runtime-lifecycle/api";

const runtimeServerURL = process.env.NEXT_PUBLIC_RUNTIME_PREPROD_INSTANCE!;

export const AskForCoffee = () => {
  //initializing states
  const [extension, setExtension] = useState<BroswerWalletExtension[]>([]);
  const [amount, setAmount] = useState<bigint | undefined>(undefined);
  const [wallet, setWallet] = useState<SupportedWalletName | undefined>(
    undefined
  );
  const [sponsor, setSponsor] = useState<string>("");
  const [amt, setAmt] = useState<string>("");

  //initialzing wallet extensions
  useEffect(() => {
    const run = async () => {
      const { getInstalledWalletExtensions } = await import(
        "@marlowe.io/wallet"
      );
      const installedWalletExtensions = getInstalledWalletExtensions();
      setExtension(installedWalletExtensions);
    };
    run();
  }, []);

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

  //deploying smart contract
  const deploy = async (e: any) => {
    e.preventDefault();

    //create wallet API
    const { mkBrowserWallet } = await import("@marlowe.io/wallet");
    const walletApi = await mkBrowserWallet(wallet!);

    // connect to runtime instance
    const { mkRuntimeLifecycle } = await import(
      "@marlowe.io/runtime-lifecycle/browser"
    );
    const runtimeLifecycle = await mkRuntimeLifecycle({
      walletName: wallet!,
      runtimeURL: runtimeServerURL,
    });

    //initialize contract parameters
    const amtLovelace = parseADA(Number(amt));

    const drinker = await walletApi.getChangeAddress();
    const sponsorAddress = sponsor as AddressBech32;

    const drinkerBech32: Party = { address: drinker };
    const sponsorBech32: Party = { address: sponsorAddress };

    // build the Smart Contract
    const myContract = mkDepositContract(
      amtLovelace,
      sponsorBech32,
      drinkerBech32      
    );

    // deploy the Smart Contract
    const contractRequest: CreateContractRequest = {
      contract: myContract,
      tags: DEPOSIT_TAG,
    };
    const [contractId, txnId] = await runtimeLifecycle.contracts.createContract(
      contractRequest
    );

    // wait for confirmation of that txn
    const contractConfirm = await walletApi.waitConfirmation(txnId);
    console.log(`Contract Creation is: ${contractConfirm}`);    
  };

  return (
    <div className="">
      <div>Ask for Coffee:</div>
      <div>Select Wallet:</div>
      <Select onValueChange={handleConnection}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="" defaultValue={wallet} />
        </SelectTrigger>
        <SelectContent>
          {extension.length > 0 &&
            wallet === undefined &&
            extension
              .filter((item) =>
                walletsSupported.includes(item.name.toLowerCase())
              )
              .map((item, index) => (
                <SelectItem key={index} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
          {wallet !== undefined && (
            <>
              <SelectItem value="disconnect">Disconnect</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
      {amount !== undefined && (
        <div>
          <div>Amount: {(Number(amount) / 1000000).toFixed(2).toString()}</div>
        </div>
      )}

      <form onSubmit={deploy}>
        <Input
          type="text"
          placeholder="Sponsor"
          value={sponsor}
          onChange={(e) => setSponsor(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Amount"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
        />
        <Button type="submit">Deploy Smart Contract</Button>
      </form>
    </div>
  );
};

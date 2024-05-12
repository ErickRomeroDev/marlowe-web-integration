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
  IDeposit,
  lovelace,
  Input as InputMarlowe,
} from "@marlowe.io/language-core-v1";
import {
  AddressBech32,
  ContractId,
  Token,  
} from "@marlowe.io/runtime-core";
import {
  BroswerWalletExtension,
  SupportedWalletName,
} from "@marlowe.io/wallet/browser";
import { useEffect, useState } from "react";
import { mkDepositContract } from "@/marlowe-contracts/mk-deposit-contract";
import { parseADA } from "@/lib/utils";
import { ApplyInputsRequest } from "@marlowe.io/runtime-lifecycle/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const runtimeServerURL = process.env.NEXT_PUBLIC_RUNTIME_PREPROD_INSTANCE!;

export const DepositTest = () => {
  //initializing states
  const [extension, setExtension] = useState<BroswerWalletExtension[]>([]);
  const [amount, setAmount] = useState<bigint | undefined>(undefined);
  const [wallet, setWallet] = useState<SupportedWalletName | undefined>(
    undefined
  );
  const [contractId, setcontractId] = useState<string>("");
  const [token, setToken] = useState<Token[] | undefined>(undefined);
  const [bob, setBob] = useState<string>("");
  const [amt, setAmt] = useState<string>("");
  const router = useRouter();

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
  console.log(runtimeServerURL)

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
      setToken(undefined);
      setAmount(undefined);
    }
  };

  //checking wallet status
  const walletStatus = async () => {
    const { mkBrowserWallet } = await import("@marlowe.io/wallet");
    const walletApi = await mkBrowserWallet(wallet!);
    const tokens = await walletApi.getTokens();
    setToken(tokens);
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

    const aliceAddr = await walletApi.getChangeAddress();
    const bobAddress = bob as AddressBech32;

    const aliceBech32: Party = { address: aliceAddr };
    const bobBech32: Party = { address: bobAddress };

    // build the Smart Contract
    const myContract = mkDepositContract(amtLovelace, aliceBech32, bobBech32);

    // deploy the Smart Contract
    const [contractId, txnId] = await runtimeLifecycle.contracts.createContract(
      {
        contract: myContract,
        //minimumLovelaceUTxODeposit: 3_000_000,
      }
    );

    // wait for confirmation of that txn
    const contractConfirm = await walletApi.waitConfirmation(txnId);
    console.log(`Contract Creation is: ${contractConfirm}`);    
    setcontractId(contractId);
  };

  const depositTx = async () => {
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

    //initialize deposit parameters
    const aliceAddr = await walletApi.getChangeAddress();
    const bobAddress = bob as AddressBech32;

    const aliceBech32: Party = { address: aliceAddr };
    const bobBech32: Party = { address: bobAddress };

    const amtLovelace = parseADA(Number(amt));
    const bintAmount = BigInt(amtLovelace);

    const contractIdTx = contractId as ContractId;

    //build the deposit
    const deposit: IDeposit = {
      input_from_party: aliceBech32,
      that_deposits: bintAmount,
      of_token: lovelace,
      into_account: bobBech32,
    };

    const inputs: InputMarlowe[] = [deposit];
    const depositRequest: ApplyInputsRequest = {
      inputs,
    };

    // submit the deposit
    const txId = await runtimeLifecycle.contracts.applyInputs(contractIdTx, depositRequest);

    // wait for deposit confirmation and check status
    const depositConfirm = await walletApi.waitConfirmation(txId);
    console.log(`Txn confirmed: ${depositConfirm}\nHere is your receipt: ${txId}`);
  };

  return (
    <div className="">
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
      {wallet !== undefined && (
        <>
          <Button onClick={walletStatus}>Show Status</Button>
        </>
      )}
      {token !== undefined && (
        <div>
          {token.map((item, index) => (
            <div key={index}>
              {item.quantity.toString()} {item.assetId.assetName}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={deploy}>
        <Input
          type="text"
          placeholder="Bob"
          value={bob}
          onChange={(e) => setBob(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Amount"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
        />
        <Button type="submit">Deploy Smart Contract</Button>
      </form>
      <Button onClick={depositTx}>Deposit</Button>
      <Link href="/">Go Back with Link</Link>
      <div onClick={() => router.push("/")}>Go back with push</div>
    </div>
  );
};

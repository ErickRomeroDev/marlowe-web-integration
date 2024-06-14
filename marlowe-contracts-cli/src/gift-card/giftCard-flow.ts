import { Blockfrost, Lucid } from "lucid-cardano";
import { readConfig } from "../../config.js";
import {
  ContractId,
  StakeAddressBech32,
  addressBech32,
  contractId,  
  payoutId,
  stakeAddressBech32,
} from "@marlowe.io/runtime-core";
import {  mkLucidWallet } from "@marlowe.io/wallet";
import { mkRuntimeLifecycle } from "@marlowe.io/runtime-lifecycle";
import {  RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { input, select } from "@inquirer/prompts";
import { bech32Validator, dateInFutureValidator, positiveBigIntValidator, waitIndicator } from "../utils/utils.js";

import {  
  ProjectParameters,  
  mkContract,
  getContractInfoPlus,  
  applyInputDeposit,
  existContractId,
  getContractsByAddress,
  getContractsByToken,
} from "./giftCard.js";

// When this script is called, start with main.
main();

async function main() {
  const config = await readConfig();
  const lucidNami = await Lucid.new(new Blockfrost(config.blockfrostUrl, config.blockfrostProjectId), config.network);
  const lucidLace = await Lucid.new(new Blockfrost(config.blockfrostUrl, config.blockfrostProjectId), config.network);
  lucidNami.selectWalletFromSeed(config.seedPhraseNami);
  lucidLace.selectWalletFromSeed(config.seedPhraseLace);
  const rewardAddressStr = await lucidNami.wallet.rewardAddress();
  const rewardAddress = rewardAddressStr ? stakeAddressBech32(rewardAddressStr) : undefined;
  const runtimeURL = config.runtimeURL;

  const walletNami = mkLucidWallet(lucidNami);
  const walletLace = mkLucidWallet(lucidLace);

  const lifecycleNami = mkRuntimeLifecycle({
    runtimeURL,
    wallet: walletNami,
  });
  const lifecycleLace = mkRuntimeLifecycle({
    runtimeURL,
    wallet: walletLace,
  });
  try {
    await mainLoop(lifecycleNami, lifecycleLace, rewardAddress);
  } catch (e) {
    console.log(`Error : ${JSON.stringify(e, null, 4)}`);
  }
}

async function mainLoop(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle, rewardAddress?: StakeAddressBech32) {
  try {
    while (true) {
      const address = (await lifecycleNami.wallet.getUsedAddresses())[0];
      console.log("Wallet address:", address);
      console.log("Reward address:", rewardAddress);
      const action = await select({
        message: "Main menu",
        choices: [
          { name: "Create a contract", value: "create" },
          { name: "Load a contract Nami", value: "loadNami" },
          { name: "Load a contract Lace", value: "loadLace" },
          // { name: "Load a contract Nami Open Role", value: "loadNamiOpen" },
          // { name: "Load a contract Lace Open Role", value: "loadLaceOpen" },
          // { name: "See Open Role Contracts", value: "downloadByOpenRole" },
          { name: "See contracts filterd by Address Nami", value: "downloadByAddressNami" },
          { name: "See contracts filtered by Token Nami", value: "downloadByTokenNami" },
          { name: "See contracts filterd by Address Lace", value: "downloadByAddressLace" },
          { name: "See contracts filtered by Token Lace", value: "downloadByTokenLace" },
          { name: "Download Payouts Nami", value: "downloadPayoutsNami" },
          { name: "withDrawPayouts Nami", value: "withDrawPayoutsNami" },
          { name: "Download Payouts Lace", value: "downloadPayoutsLace" },
          { name: "withDrawPayouts Lace", value: "withDrawPayoutsLace" },
          { name: "Exit", value: "exit" },
        ],
      });
      switch (action) {
        case "create":
          await createContractMenu(lifecycleNami, lifecycleLace, rewardAddress);
          break;
        case "loadNami":
          await loadNami(lifecycleNami, lifecycleLace);
          break;
        case "loadLace":
          await loadLace(lifecycleNami, lifecycleLace);
          break;
        // case "loadNamiOpen":
        //   await loadNamiOpen(lifecycleNami, lifecycleLace);
        //   break;
        // case "loadLaceOpen":
        //   await loadLaceOpen(lifecycleNami, lifecycleLace);
        //   break;
        // case "downloadByOpenRole":
        //   await downloadByOpenRole(lifecycleNami);
        //   break;
        case "downloadByAddressNami":
          await downloadByAddressNami(lifecycleNami);
          break;
        case "downloadByTokenNami":
          await downloadByTokenNami(lifecycleNami);
          break;
        case "downloadByAddressLace":
          await downloadByAddressLace(lifecycleLace);
          break;
        case "downloadByTokenLace":
          await downloadByTokenLace(lifecycleLace);
          break;
        case "downloadPayoutsNami":
          await downloadPayoutsNami(lifecycleNami);
          break;
        case "withDrawPayoutsNami":
          await withDrawPayoutsNami(lifecycleNami);
          break;
          case "downloadPayoutsLace":
          await downloadPayoutsLace(lifecycleLace);
          break;
        case "withDrawPayoutsLace":
          await withDrawPayoutsLace(lifecycleLace);
          break;
        case "exit":
          process.exit(0);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("closed the prompt")) {
      process.exit(0);
    }
    if (e instanceof Error) {
      console.error(e.message);
      process.exit(1);
    } else {
      throw e;
    }
  }
}

export async function createContractMenu(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  rewardAddress?: StakeAddressBech32
) {
  const payee = addressBech32(
    await input({
      message: "Enter the Beneficiary Address",
      validate: bech32Validator,
    })
  );
  const amountStr = await input({
    message: "Enter the payment amount in lovelaces",
    validate: positiveBigIntValidator,
  });

  const amount = BigInt(amountStr);

  const depositDeadlineStr = await input({
    message: "Enter the deposit deadline",
    validate: dateInFutureValidator,
  });
  const depositDeadline = new Date(depositDeadlineStr);

  const beneficiaryName = await input({
    message: "Enter the Beneficiary name",
  });

  const walletAddress = (await lifecycleNami.wallet.getUsedAddresses())[0];
  console.log(`Send GitfCard:\n * to  ${payee}\n * to ${walletAddress}\n * for ${amount} lovelaces\n`);
  if (rewardAddress) {
    console.log(`In the meantime, the contract will stake rewards to ${rewardAddress}`);
  }

  const scheme: ProjectParameters = {
    payer: walletAddress,
    payee,
    amount,
    depositDeadline,
    beneficiaryName,
  }; 
  const contractInstance = await mkContract(scheme, lifecycleNami, rewardAddress);

  console.log(`Contract created with id ${contractInstance.id}`);

  await contractInstance.waitForConfirmation();  

  console.log(`Contract id ${contractInstance.id} was successfully submited to the blockchain`);

  return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, contractInstance.id);
}

async function loadNami(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle) {
  // First we ask the user for a contract id
  const cidStr = await input({
    message: "Enter the contractId",
  });
  const cid = contractId(cidStr);
 
  try {
    await existContractId(cid, lifecycleNami);
  } catch (error) {
    console.log("contract Invalid");
    return;
  }

  return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, cid);
}

async function contractMenuAddressRolesNami(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  contractId: ContractId    
): Promise<void> {  
  const contractInfoPlus = await getContractInfoPlus(contractId, lifecycleNami);
  const actions = contractInfoPlus!.myChoices;
  
  console.log("state",contractInfoPlus!.statePlus)  

  const selectedAction = await select({  
    message: "Contract menu",  
    choices: actions,
  });
  switch (selectedAction.type) {   
    case "Advance":
    case "Deposit":
      const txId = await applyInputDeposit(contractInfoPlus, selectedAction);      
      console.log(`Input applied with txId ${txId}`);
      await waitIndicator(lifecycleNami.wallet, txId);
      return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, contractId);
  }
}

async function loadLace(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle) {
  // First we ask the user for a contract id
  const cidStr = await input({
    message: "Enter the contractId",
  });
  const cid = contractId(cidStr);
 
  try {
    await existContractId(cid, lifecycleLace);
  } catch (error) {
    console.log("contract Invalid");
    return;
  }

  return contractMenuAddressRolesLace(lifecycleNami, lifecycleLace, cid);
}

async function contractMenuAddressRolesLace(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  contractId: ContractId    
): Promise<void> {  
  const contractInfoPlus = await getContractInfoPlus(contractId, lifecycleLace);
  const actions = contractInfoPlus!.myChoices;
  
  console.log("state",contractInfoPlus!.statePlus)  

  const selectedAction = await select({  
    message: "Contract menu",  
    choices: actions,
  });
  switch (selectedAction.type) {   
    case "Advance":
    case "Deposit":
      const txId = await applyInputDeposit(contractInfoPlus, selectedAction);      
      console.log(`Input applied with txId ${txId}`);
      await waitIndicator(lifecycleLace.wallet, txId);
      return contractMenuAddressRolesLace(lifecycleNami, lifecycleLace, contractId);
  }
}

export async function downloadByAddressNami(lifecycleNami: RuntimeLifecycle) {   
  const InfoBasic = await getContractsByAddress(lifecycleNami);
  const rangeNext = InfoBasic.page.next;
  const InfoBasicNext = await getContractsByAddress(lifecycleNami, rangeNext);
  console.log("InfoBasic",InfoBasic);
  console.log("InfoBasicNext",InfoBasicNext);
}

export async function downloadByTokenNami(lifecycleNami: RuntimeLifecycle) {
  const InfoBasic = await getContractsByToken("payee", lifecycleNami);
  const rangeNext = InfoBasic.page.next;
  const InfoBasicNext = await getContractsByToken("payee", lifecycleNami, rangeNext);
  console.log("InfoBasic",InfoBasic);
  console.log("InfoBasicNext",InfoBasicNext);  
}

export async function downloadByAddressLace(lifecycleLace: RuntimeLifecycle) {  
  const InfoBasic = await getContractsByAddress(lifecycleLace);
  const rangeNext = InfoBasic.page.next;
  const InfoBasicNext = await getContractsByAddress(lifecycleLace, rangeNext);
  console.log("InfoBasic",InfoBasic);
  console.log("InfoBasicNext",InfoBasicNext);
}

export async function downloadByTokenLace(lifecycleLace: RuntimeLifecycle) {
  const InfoBasic = await getContractsByToken("payee", lifecycleLace);
  const rangeNext = InfoBasic.page.next;
  const InfoBasicNext = await getContractsByToken("payee", lifecycleLace, rangeNext);
  console.log("InfoBasic",InfoBasic);
  console.log("InfoBasicNext",InfoBasicNext);  
}

export async function downloadPayoutsNami(lifecycleNami: RuntimeLifecycle) {
  const available = await lifecycleNami.payouts.available();
  const widthdrawn = await lifecycleNami.payouts.withdrawn();

  console.log("available", available);
  console.log("widthdrawn", widthdrawn);
}

export async function withDrawPayoutsNami(lifecycleNami: RuntimeLifecycle) {
  const payoutIdentification = payoutId(
    await input({
      message: "Enter the Payout Id",
    })
  );

  //There is no TxId in this version, but the function waits for the tx to be in the blockchain
  const txId = await lifecycleNami.payouts.withdraw([payoutIdentification]);
  console.log("txId",txId);
}

export async function downloadPayoutsLace(lifecycleLace: RuntimeLifecycle) {
  const available = await lifecycleLace.payouts.available();
  const widthdrawn = await lifecycleLace.payouts.withdrawn();

  console.log("available", available);
  console.log("widthdrawn", widthdrawn);
}

export async function withDrawPayoutsLace(lifecycleLace: RuntimeLifecycle) {
  const payoutIdentification = payoutId(
    await input({
      message: "Enter the Payout Id",
    })
  );

  //There is no TxId in this version, but the function waits for the tx to be in the blockchain
  const txId = await lifecycleLace.payouts.withdraw([payoutIdentification]);
  console.log("txId",txId);
}
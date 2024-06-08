import { Blockfrost, Lucid } from "lucid-cardano";
import { readConfig } from "../../config.js";
import {
  AddressBech32,
  StakeAddressBech32,
  addressBech32,
  contractId,
  contractIdToTxId,
  payoutId,
  stakeAddressBech32,
} from "@marlowe.io/runtime-core";
import { WalletAPI, mkLucidWallet } from "@marlowe.io/wallet";
import { mkRuntimeLifecycle } from "@marlowe.io/runtime-lifecycle";
import { CanAdvance, CanDeposit, ContractInstanceAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { input, select } from "@inquirer/prompts";
import { bech32Validator, dateInFutureValidator, positiveBigIntValidator, waitIndicator } from "../utils/utils.js";
import { SourceMap, mkSourceMap } from "../utils/experimental-features/source-map.js";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import {
  ProjectAnnotations,
  ProjectParameters,
  projectGetMyActions,
  projectGetOpenRoleActions,
  projectGetState,
  projectMetadata,
  projectStatePlus,
  projectTag,
  projectTemplate,
  projectValidation,
  mkProject,
} from "./escrow.js";
import { ContractHeader, GetContractsRequest, mintRole } from "@marlowe.io/runtime-rest-client/contract";

// When this script is called, start with main.
const tags_array = ["MARLOWE_ESCROW1"];
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
          { name: "Load a contract Nami Open Role", value: "loadNamiOpen" },
          { name: "Load a contract Lace Open Role", value: "loadLaceOpen" },
          { name: "See Open Role Contracts", value: "downloadByOpenRole" },
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
        case "loadNamiOpen":
          await loadNamiOpen(lifecycleNami, lifecycleLace);
          break;
        case "loadLaceOpen":
          await loadLaceOpen(lifecycleNami, lifecycleLace);
          break;
        case "downloadByOpenRole":
          await downloadByOpenRole(lifecycleNami);
          break;
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

/**
 * This is an Inquirer.js flow to create a contract
 * @param lifecycle An instance of the RuntimeLifecycle
 * @param rewardAddress An optional reward address to stake the contract rewards
 */
export async function createContractMenu(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  rewardAddress?: StakeAddressBech32
) {
  const auditor = addressBech32(
    await input({
      message: "Enter the auditor address",
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

  const releaseDeadlineStr = await input({
    message: "Enter the release deadline",
    validate: dateInFutureValidator,
  });
  const releaseDeadline = new Date(releaseDeadlineStr);

  const projectName = await input({
    message: "Enter the project name",
  });

  const githubUrl = await input({
    message: "Enter the githubUrl",
  });

  const walletAddress = (await lifecycleNami.wallet.getUsedAddresses())[0];
  console.log(`Fund my project:\n * from  VC\n * to ${walletAddress}\n * for ${amount} lovelaces\n`);
  if (rewardAddress) {
    console.log(`In the meantime, the contract will stake rewards to ${rewardAddress}`);
  }

  const scheme: ProjectParameters = {
    auditor,
    payee: walletAddress,
    amount,
    depositDeadline,
    releaseDeadline,
    projectName,
    githubUrl,
  };
  const tokenVCMetadata = {
    name: "VC Token",
    description: "These tokens give access to deposit on the contract",
    image: "ipfs://QmaQMH7ybS9KmdYQpa4FMtAhwJH5cNaacpg4fTwhfPvcwj",
    mediaType: "image/png",
    files: [
      {
        name: "icon-1000",
        mediaType: "image/webp",
        src: "ipfs://QmUbvavFxGSSEo3ipQf7rjrELDvXHDshWkHZSpV8CVdSE5",
      },
    ],
  };
  const tokenAuditorMetadata = {
    name: "Auditor Token",
    description: "These tokens give access to cancel the contract",
    image: "ipfs://QmaQMH7ybS9KmdYQpa4FMtAhwJH5cNaacpg4fTwhfPvcwj",
    mediaType: "image/png",
    files: [
      {
        name: "icon-1000",
        mediaType: "image/webp",
        src: "ipfs://QmUbvavFxGSSEo3ipQf7rjrELDvXHDshWkHZSpV8CVdSE5",
      },
    ],
  };
  const metadata = projectTemplate.toMetadata(scheme);
  const sourceMap = await mkSourceMap(lifecycleNami, mkProject(scheme));
  const contractInstance = await sourceMap.createContract({
    stakeAddress: rewardAddress,
    tags: projectTag,
    metadata,
    roles: {
      payer: mintRole("OpenRole", 1n, tokenVCMetadata),
      auditor: mintRole(scheme.auditor, 1n, tokenAuditorMetadata),
    },
  });

  console.log(`Contract created with id ${contractInstance.id}`);

  // this is another option to wait for a tx when using the instance of the contract
  // await contractInstance.waitForConfirmation();
  await waitIndicator(lifecycleNami.wallet, contractIdToTxId(contractInstance.id));

  console.log(`Contract id ${contractInstance.id} was successfully submited to the blockchain`);

  return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
}

async function loadNami(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle) {
  // First we ask the user for a contract id
  const cidStr = await input({
    message: "Enter the contractId",
  });
  const cid = contractId(cidStr);
  // Then we make sure that contract id is an instance of our fund my project contract
  const validationResult = await projectValidation(lifecycleNami, cid);
  if (validationResult === "InvalidMarloweTemplate") {
    console.log("Invalid contract, it does not have the expected tags");
    return;
  }
  if (validationResult === "InvalidContract") {
    console.log("Invalid contract, it does not have the expected contract source");
    return;
  }

  // If it is, we print the contract details and go to the contract menu
  console.log("Contract details:");
  console.log(`  * Pay from: VC Open Role`);
  console.log(`  * Pay to: ${validationResult.scheme.payee}`);
  console.log(`  * Amount: ${validationResult.scheme.amount} lovelaces`);
  console.log(`  * Deposit deadline: ${validationResult.scheme.depositDeadline}`);
  console.log(`  Project Name: ${validationResult.scheme.projectName}`);
  console.log(`  Project Github: ${validationResult.scheme.githubUrl}`);
  const contractInstance = await lifecycleNami.newContractAPI.load(cid);
  return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, contractInstance, validationResult.scheme, validationResult.sourceMap);
}

async function contractMenuAddressRolesNami(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  contractInstance: ContractInstanceAPI,
  scheme: ProjectParameters,
  sourceMap: SourceMap<ProjectAnnotations>
): Promise<void> {
  const inputHistory = await contractInstance.getInputHistory();
  const details = await contractInstance.getDetails();
  if (details.type === "closed") {
    return;
  }

  const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, sourceMap);

  if (contractState.type === "Closed") return;

  projectStatePlus(contractState, scheme);
  // See what actions are applicable to the current contract state
  const applicableActions = await contractInstance.evaluateApplicableActions();

  const choices = projectGetMyActions(applicableActions, contractState);

  const selectedAction = await select({
    message: "Contract menu",
    choices,
  });
  switch (selectedAction.type) {
    case "check-state":
      return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
    case "return":
      return;
    case "Choice":
      const applicableInputChoose = await applicableActions.toInput(selectedAction, 1n);
      const txIdChoose = await applicableActions.apply({
        input: applicableInputChoose,
      });
      console.log(`Input applied with txId ${txIdChoose}`);
      await waitIndicator(lifecycleNami.wallet, txIdChoose);
      return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
    case "Advance":
      console.log("Applying input");
      const applicableInput = await applicableActions.toInput(selectedAction);
      console.log("applicableInput", applicableInput);

      const txId = await applicableActions.apply({
        input: applicableInput,
      });

      console.log(`Input applied with txId ${txId}`);
      await waitIndicator(lifecycleNami.wallet, txId);
      return contractMenuAddressRolesNami(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
  }
}

async function loadLace(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle) {
  // First we ask the user for a contract id
  const cidStr = await input({
    message: "Enter the contractId",
  });
  const cid = contractId(cidStr);
  // Then we make sure that contract id is an instance of our fund my project contract
  const validationResult = await projectValidation(lifecycleLace, cid);
  if (validationResult === "InvalidMarloweTemplate") {
    console.log("Invalid contract, it does not have the expected tags");
    return;
  }
  if (validationResult === "InvalidContract") {
    console.log("Invalid contract, it does not have the expected contract source");
    return;
  }

  // If it is, we print the contract details and go to the contract menu
  console.log("Contract details:");
  console.log(`  * Pay from: VC Open Role`);
  console.log(`  * Pay to: ${validationResult.scheme.payee}`);
  console.log(`  * Amount: ${validationResult.scheme.amount} lovelaces`);
  console.log(`  * Deposit deadline: ${validationResult.scheme.depositDeadline}`);
  console.log(`  Project Name: ${validationResult.scheme.projectName}`);
  console.log(`  Project Github: ${validationResult.scheme.githubUrl}`);
  const contractInstance = await lifecycleLace.newContractAPI.load(cid);
  return contractMenuAddressRolesLace(lifecycleNami, lifecycleLace, contractInstance, validationResult.scheme, validationResult.sourceMap);
}

async function contractMenuAddressRolesLace(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  contractInstance: ContractInstanceAPI,
  scheme: ProjectParameters,
  sourceMap: SourceMap<ProjectAnnotations>
): Promise<void> {
  const inputHistory = await contractInstance.getInputHistory();
  const details = await contractInstance.getDetails();
  if (details.type === "closed") {
    return;
  }

  const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, sourceMap);

  if (contractState.type === "Closed") return;

  projectStatePlus(contractState, scheme);
  // See what actions are applicable to the current contract state
  const applicableActions = await contractInstance.evaluateApplicableActions();

  const choices = projectGetMyActions(applicableActions, contractState);

  const selectedAction = await select({
    message: "Contract menu",
    choices,
  });
  switch (selectedAction.type) {
    case "check-state":
      return contractMenuAddressRolesLace(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
    case "return":
      return;
    case "Choice":
      const applicableInputChoose = await applicableActions.toInput(selectedAction, 1n);
      const txIdChoose = await applicableActions.apply({
        input: applicableInputChoose,
      });
      console.log(`Input applied with txId ${txIdChoose}`);
      await waitIndicator(lifecycleLace.wallet, txIdChoose);
      return contractMenuAddressRolesLace(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
    case "Advance":
      console.log("Applying input");
      const applicableInput = await applicableActions.toInput(selectedAction);
      console.log("applicableInput", applicableInput);

      const txId = await applicableActions.apply({
        input: applicableInput,
      });

      console.log(`Input applied with txId ${txId}`);
      await waitIndicator(lifecycleLace.wallet, txId);
      return contractMenuAddressRolesLace(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
  }
}

async function loadNamiOpen(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle) {
  // First we ask the user for a contract id
  const cidStr = await input({
    message: "Enter the contractId",
  });
  const cid = contractId(cidStr);
  // Then we make sure that contract id is an instance of our fund my project contract
  const validationResult = await projectValidation(lifecycleNami, cid);
  if (validationResult === "InvalidMarloweTemplate") {
    console.log("Invalid contract, it does not have the expected tags");
    return;
  }
  if (validationResult === "InvalidContract") {
    console.log("Invalid contract, it does not have the expected contract source");
    return;
  }

  // If it is, we print the contract details and go to the contract menu
  console.log("Contract details:");
  console.log(`  * Pay from: VC Open Role`);
  console.log(`  * Pay to: ${validationResult.scheme.payee}`);
  console.log(`  * Amount: ${validationResult.scheme.amount} lovelaces`);
  console.log(`  * Deposit deadline: ${validationResult.scheme.depositDeadline}`);
  console.log(`  Project Name: ${validationResult.scheme.projectName}`);
  console.log(`  Project Github: ${validationResult.scheme.githubUrl}`);
  const contractInstance = await lifecycleNami.newContractAPI.load(cid);
  return contractMenuOpenRolesNami(lifecycleNami, lifecycleLace, contractInstance, validationResult.scheme, validationResult.sourceMap);
}

async function contractMenuOpenRolesNami(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  contractInstance: ContractInstanceAPI,
  scheme: ProjectParameters,
  sourceMap: SourceMap<ProjectAnnotations>
): Promise<void> {
  const inputHistory = await contractInstance.getInputHistory();
  const details = await contractInstance.getDetails();
  if (details.type === "closed") {
    return;
  }

  const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, sourceMap);

  if (contractState.type === "Closed") return;

  projectStatePlus(contractState, scheme);
  // See what actions are applicable to the current contract state
  const applicableActions = await contractInstance.evaluateApplicableActions();

  const choices = projectGetOpenRoleActions(applicableActions, contractState);

  const selectedAction = await select({
    message: "Contract menu",
    choices,
  });
  switch (selectedAction.type) {
    case "check-state":
      return contractMenuOpenRolesNami(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
    case "return":
      return;
    case "Deposit":
      console.log("Applying input");
      const applicableInput = await applicableActions.toInput(selectedAction);
      console.log("applicableInput", applicableInput);

      //modern way
      const txId = await applicableActions.apply({
        input: applicableInput,
      });

      console.log(`Input applied with txId ${txId}`);
      await waitIndicator(lifecycleNami.wallet, txId);
      return contractMenuOpenRolesNami(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
  }
}

async function loadLaceOpen(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle) {
  // First we ask the user for a contract id
  const cidStr = await input({
    message: "Enter the contractId",
  });
  const cid = contractId(cidStr);
  // Then we make sure that contract id is an instance of our fund my project contract
  const validationResult = await projectValidation(lifecycleLace, cid);
  if (validationResult === "InvalidMarloweTemplate") {
    console.log("Invalid contract, it does not have the expected tags");
    return;
  }
  if (validationResult === "InvalidContract") {
    console.log("Invalid contract, it does not have the expected contract source");
    return;
  }

  // If it is, we print the contract details and go to the contract menu
  console.log("Contract details:");
  console.log(`  * Pay from: VC Open Role`);
  console.log(`  * Pay to: ${validationResult.scheme.payee}`);
  console.log(`  * Amount: ${validationResult.scheme.amount} lovelaces`);
  console.log(`  * Deposit deadline: ${validationResult.scheme.depositDeadline}`);
  console.log(`  Project Name: ${validationResult.scheme.projectName}`);
  console.log(`  Project Github: ${validationResult.scheme.githubUrl}`);
  const contractInstance = await lifecycleLace.newContractAPI.load(cid);
  return contractMenuOpenRolesLace(lifecycleNami, lifecycleLace, contractInstance, validationResult.scheme, validationResult.sourceMap);
}

async function contractMenuOpenRolesLace(
  lifecycleNami: RuntimeLifecycle,
  lifecycleLace: RuntimeLifecycle,
  contractInstance: ContractInstanceAPI,
  scheme: ProjectParameters,
  sourceMap: SourceMap<ProjectAnnotations>
): Promise<void> {
  const inputHistory = await contractInstance.getInputHistory();
  const details = await contractInstance.getDetails();
  if (details.type === "closed") {
    return;
  }

  const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, sourceMap);

  if (contractState.type === "Closed") return;

  projectStatePlus(contractState, scheme);
  // See what actions are applicable to the current contract state
  const applicableActions = await contractInstance.evaluateApplicableActions();

  const choices = projectGetOpenRoleActions(applicableActions, contractState);

  const selectedAction = await select({
    message: "Contract menu",
    choices,
  });
  switch (selectedAction.type) {
    case "check-state":
      return contractMenuOpenRolesNami(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
    case "return":
      return;
    case "Deposit":
      console.log("Applying input");
      const applicableInput = await applicableActions.toInput(selectedAction);
      console.log("applicableInput", applicableInput);

      //modern way
      const txId = await applicableActions.apply({
        input: applicableInput,
      });

      console.log(`Input applied with txId ${txId}`);
      await waitIndicator(lifecycleLace.wallet, txId);
      return contractMenuOpenRolesLace(lifecycleNami, lifecycleLace, contractInstance, scheme, sourceMap);
  }
}

export async function downloadByOpenRole(lifecycleNami: RuntimeLifecycle) {
  const contractsRequest: GetContractsRequest = {
    tags: tags_array,
  };
  const contractHeaders = await lifecycleNami.restClient.getContracts(contractsRequest);
  const contractHeadersContracts = contractHeaders.contracts;

  //Filter contracts by Input history and available actions to find Open Roles
  const contractHeaderFilteredByOpenRole = await Promise.all(
    contractHeadersContracts.map(async (item) => {
      try {
        const contractInstance = await lifecycleNami.newContractAPI.load(item.contractId);
        const details = await contractInstance.getDetails();
        if (details.type === "closed") {
          return undefined;
        }
        const history = await contractInstance.getInputHistory();
        const applicableActions = await lifecycleNami.applicableActions.getApplicableActions(details);
        const depositAvailable = applicableActions.some((item) => item.type === "Deposit");

        if (history.length === 0 && depositAvailable) {
          return item;
        }
      } catch (error) {
        return undefined;
      }
    })
  );
  console.log("headers", contractHeaderFilteredByOpenRole);

  //display state
  await Promise.all(
    contractHeaderFilteredByOpenRole.map(async (item) => {
      if (item === undefined) {
        return null;
      }
      try {
        const result = await projectValidation(lifecycleNami, item.contractId);
        if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
          // throw new Error("invalid");
          console.log("invalid");
          return;
        }
        const contractInstance = await lifecycleNami.newContractAPI.load(item.contractId);
        const inputHistory = await contractInstance.getInputHistory();
        const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, result.sourceMap);
        console.log("contractState", contractState);
      } catch (error) {
        console.log("error", error);
      }
    })
  );
}

export async function downloadByAddressNami(lifecycleNami: RuntimeLifecycle) {
  //Address option
  const [walletAddress] = await lifecycleNami.wallet.getUsedAddresses();
  const contractsRequest: GetContractsRequest = {
    tags: tags_array,
    partyAddresses: [walletAddress] as AddressBech32[],
  };
  const contractHeaders = await lifecycleNami.restClient.getContracts(contractsRequest);
  const contractHeadersContracts = contractHeaders.contracts;
  console.log("headers", contractHeadersContracts);

  //display state
  await Promise.all(
    contractHeadersContracts.map(async (item) => {
      if (item === undefined) {
        return null;
      }
      try {
        const result = await projectValidation(lifecycleNami, item.contractId);
        if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
          // throw new Error("invalid");
          console.log("invalid");
          return;
        }
        const contractInstance = await lifecycleNami.newContractAPI.load(item.contractId);
        const inputHistory = await contractInstance.getInputHistory();
        const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, result.sourceMap);
        console.log("contractState", contractState);
      } catch (error) {
        console.log("error", error);
      }
    })
  );
}

export async function downloadByTokenNami(lifecycleNami: RuntimeLifecycle) {
  const contractsRequest: GetContractsRequest = {
    tags: tags_array,
  };
  const contractHeaders = await lifecycleNami.restClient.getContracts(contractsRequest);

  //Filter token option
  const walletTokens = await lifecycleNami.wallet.getTokens();
  const tokenAssetName = ["auditor", "payer"] as string[];

  //filter those contracts that have Policy ID, if they dont have one they have ""
  const filteredByRoleTokenMintingPolicy = contractHeaders.contracts.filter((header) => header.roleTokenMintingPolicyId);

  //predicate
  const filteredByWalletTokens = (header: ContractHeader): boolean => {
    return walletTokens.some(
      (item) =>
        item.assetId.policyId === header.roleTokenMintingPolicyId &&
        (item.assetId.assetName === tokenAssetName[0] || item.assetId.assetName === tokenAssetName[1])
    );
  };

  //filter by tokens on the wallet
  const contractHeaderFilteredByWallet = filteredByRoleTokenMintingPolicy.filter((header) => filteredByWalletTokens(header));
  console.log("headers", contractHeaderFilteredByWallet);

  //display state
  await Promise.all(
    contractHeaderFilteredByWallet.map(async (item) => {
      if (item === undefined) {
        return null;
      }
      try {
        const result = await projectValidation(lifecycleNami, item.contractId);
        if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
          // throw new Error("invalid");
          console.log("invalid");
          return;
        }
        const contractInstance = await lifecycleNami.newContractAPI.load(item.contractId);
        const inputHistory = await contractInstance.getInputHistory();
        const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, result.sourceMap);
        console.log("contractState", contractState);
      } catch (error) {
        console.log("error", error);
      }
    })
  );
}

export async function downloadByAddressLace(lifecycleLace: RuntimeLifecycle) {
  //Address option
  const [walletAddress] = await lifecycleLace.wallet.getUsedAddresses();
  const contractsRequest: GetContractsRequest = {
    tags: tags_array,
    partyAddresses: [walletAddress] as AddressBech32[],
  };
  const contractHeaders = await lifecycleLace.restClient.getContracts(contractsRequest);
  const contractHeadersContracts = contractHeaders.contracts;
  console.log("headers", contractHeadersContracts);

  //display state
  await Promise.all(
    contractHeadersContracts.map(async (item) => {
      if (item === undefined) {
        return null;
      }
      try {
        const result = await projectValidation(lifecycleLace, item.contractId);
        if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
          // throw new Error("invalid");
          console.log("invalid");
          return;
        }
        const contractInstance = await lifecycleLace.newContractAPI.load(item.contractId);
        const inputHistory = await contractInstance.getInputHistory();
        const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, result.sourceMap);
        console.log("contractState", contractState);
      } catch (error) {
        console.log("error", error);
      }
    })
  );
}

export async function downloadByTokenLace(lifecycleLace: RuntimeLifecycle) {
  const contractsRequest: GetContractsRequest = {
    tags: tags_array,
  };
  const contractHeaders = await lifecycleLace.restClient.getContracts(contractsRequest);

  //Filter token option
  const walletTokens = await lifecycleLace.wallet.getTokens();
  const tokenAssetName = ["auditor", "payer"] as string[];

  //filter those contracts that have Policy ID, if they dont have one they have ""
  const filteredByRoleTokenMintingPolicy = contractHeaders.contracts.filter((header) => header.roleTokenMintingPolicyId);

  //predicate
  const filteredByWalletTokens = (header: ContractHeader): boolean => {
    return walletTokens.some(
      (item) =>
        item.assetId.policyId === header.roleTokenMintingPolicyId &&
        (item.assetId.assetName === tokenAssetName[0] || item.assetId.assetName === tokenAssetName[1])
    );
  };

  //filter by tokens on the wallet
  const contractHeaderFilteredByWallet = filteredByRoleTokenMintingPolicy.filter((header) => filteredByWalletTokens(header));
  console.log("headers", contractHeaderFilteredByWallet);

  //display state
  await Promise.all(
    contractHeaderFilteredByWallet.map(async (item) => {
      if (item === undefined) {
        return null;
      }
      try {
        const result = await projectValidation(lifecycleLace, item.contractId);
        if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
          // throw new Error("invalid");
          console.log("invalid");
          return;
        }
        const contractInstance = await lifecycleLace.newContractAPI.load(item.contractId);
        const inputHistory = await contractInstance.getInputHistory();
        const contractState = projectGetState(datetoTimeout(new Date()), inputHistory, result.sourceMap);
        console.log("contractState", contractState);
      } catch (error) {
        console.log("error", error);
      }
    })
  );
}

export async function downloadPayoutsNami(lifecycleNami: RuntimeLifecycle) {
  const available = await lifecycleNami.payouts.available();
  const widthdrawn = await lifecycleNami.payouts.withdrawn();
  console.log("success")

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
  console.log("tx was proccesed");
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
  console.log("tx was proccesed");
}

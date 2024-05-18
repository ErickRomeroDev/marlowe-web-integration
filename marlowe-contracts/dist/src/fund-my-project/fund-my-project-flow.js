import { Blockfrost, Lucid } from "lucid-cardano";
import { readConfig } from "../../config.js";
import { addressBech32, contractId, contractIdToTxId, stakeAddressBech32 } from "@marlowe.io/runtime-core";
import { mkLucidWallet } from "@marlowe.io/wallet";
import { mkRuntimeLifecycle } from "@marlowe.io/runtime-lifecycle";
import { input, select } from "@inquirer/prompts";
import { bech32Validator, dateInFutureValidator, positiveBigIntValidator, waitIndicator } from "../utils/utils.js";
import { mkSourceMap } from "../utils/experimental-features/source-map.js";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import { fundMyProjectGetActions, fundMyProjectGetState, fundMyProjectPrintState, fundMyProjectTag, fundMyProjectTemplate, fundMyProjectValidation, mkFundMyProject, } from "./fund-my-project.js";
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
    }
    catch (e) {
        console.log(`Error : ${JSON.stringify(e, null, 4)}`);
    }
}
async function mainLoop(lifecycleNami, lifecycleLace, rewardAddress) {
    try {
        while (true) {
            const address = (await lifecycleNami.wallet.getUsedAddresses())[0];
            console.log("Wallet address:", address);
            console.log("Reward address:", rewardAddress);
            const action = await select({
                message: "Main menu",
                choices: [
                    { name: "Create a contract", value: "create" },
                    { name: "Load a contract", value: "load" },
                    { name: "Exit", value: "exit" },
                ],
            });
            switch (action) {
                case "create":
                    await createContractMenu(lifecycleNami, lifecycleLace, rewardAddress);
                    break;
                case "load":
                    await loadContractMenu(lifecycleLace, lifecycleNami);
                    break;
                case "exit":
                    process.exit(0);
            }
        }
    }
    catch (e) {
        if (e instanceof Error && e.message.includes("closed the prompt")) {
            process.exit(0);
        }
        if (e instanceof Error) {
            console.error(e.message);
            process.exit(1);
        }
        else {
            throw e;
        }
    }
}
/**
 * This is an Inquirer.js flow to create a contract
 * @param lifecycle An instance of the RuntimeLifecycle
 * @param rewardAddress An optional reward address to stake the contract rewards
 */
export async function createContractMenu(lifecycleNami, lifecycleLace, rewardAddress) {
    const payer = addressBech32(await input({
        message: "Enter the VC address",
        validate: bech32Validator,
    }));
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
    const projectName = await input({
        message: "Enter the project name",
    });
    const githubUrl = await input({
        message: "Enter the githubUrl",
    });
    const walletAddress = (await lifecycleNami.wallet.getUsedAddresses())[0];
    console.log(`Fund my project:\n * from  ${payer}\n * to ${walletAddress}\n * for ${amount} lovelaces\n`);
    if (rewardAddress) {
        console.log(`In the meantime, the contract will stake rewards to ${rewardAddress}`);
    }
    const scheme = {
        payer,
        payee: walletAddress,
        amount,
        depositDeadline,
        projectName,
        githubUrl,
    };
    const metadata = fundMyProjectTemplate.toMetadata(scheme);
    const sourceMap = await mkSourceMap(lifecycleNami, mkFundMyProject(scheme));
    const contractInstance = await sourceMap.createContract({
        stakeAddress: rewardAddress,
        tags: fundMyProjectTag,
        metadata,
    });
    console.log(`Contract created with id ${contractInstance.id}`);
    // this is another option to wait for a tx when using the instance of the contract
    // await contractInstance.waitForConfirmation();
    await waitIndicator(lifecycleNami.wallet, contractIdToTxId(contractInstance.id));
    console.log(`Contract id ${contractInstance.id} was successfully submited to the blockchain`);
    return contractMenu(lifecycleNami.wallet, lifecycleLace.wallet, contractInstance, scheme, sourceMap);
}
/**
 * This is an Inquirer.js flow to load an existing contract
 * @param lifecycle
 * @returns
 */
async function loadContractMenu(lifecycleLace, lifecycleNami) {
    // First we ask the user for a contract id
    const cidStr = await input({
        message: "Enter the contractId",
    });
    const cid = contractId(cidStr);
    // Then we make sure that contract id is an instance of our fund my project contract
    const validationResult = await fundMyProjectValidation(lifecycleLace, cid);
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
    console.log(`  * Pay from: ${validationResult.scheme.payer}`);
    console.log(`  * Pay to: ${validationResult.scheme.payee}`);
    console.log(`  * Amount: ${validationResult.scheme.amount} lovelaces`);
    console.log(`  * Deposit deadline: ${validationResult.scheme.depositDeadline}`);
    console.log(`  Project Name: ${validationResult.scheme.projectName}`);
    console.log(`  Project Github: ${validationResult.scheme.githubUrl}`);
    const contractInstance = await lifecycleLace.newContractAPI.load(cid);
    return contractMenu(lifecycleNami.wallet, lifecycleLace.wallet, contractInstance, validationResult.scheme, validationResult.sourceMap);
}
/**
 * This is an Inquirer.js flow to interact with a contract
 */
async function contractMenu(walletNami, walletLace, contractInstance, scheme, sourceMap) {
    const inputHistory = await contractInstance.getInputHistory();
    // console.log({ inputHistory });
    const contractState = fundMyProjectGetState(datetoTimeout(new Date()), inputHistory, sourceMap);
    // console.log({ contractState });
    if (contractState.type === "Closed")
        return;
    fundMyProjectPrintState(contractState, scheme);
    // See what actions are applicable to the current contract state
    const applicableActions = await contractInstance.evaluateApplicableActions();
    //   console.log({ applicableActions });
    const choices = fundMyProjectGetActions(applicableActions, contractState);
    const selectedAction = await select({
        message: "Contract menu",
        choices,
    });
    switch (selectedAction.type) {
        case "check-state":
            return contractMenu(walletNami, walletLace, contractInstance, scheme, sourceMap);
        case "return":
            return;
        case "Advance":
        case "Deposit":
            console.log("Applying input");
            const applicableInput = await applicableActions.toInput(selectedAction);
            const txId = await applicableActions.apply({
                input: applicableInput,
            });
            console.log(`Input applied with txId ${txId}`);
            await waitIndicator(walletLace, txId);
            return contractMenu(walletNami, walletLace, contractInstance, scheme, sourceMap);
    }
}
//# sourceMappingURL=fund-my-project-flow.js.map
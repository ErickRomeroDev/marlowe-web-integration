import { Blockfrost, Lucid } from "lucid-cardano";
import { readConfig } from "../../config.js";
import { StakeAddressBech32, addressBech32, contractIdToTxId, stakeAddressBech32 } from "@marlowe.io/runtime-core";
import { mkLucidWallet } from "@marlowe.io/wallet";
import { mkRuntimeLifecycle } from "@marlowe.io/runtime-lifecycle";
import { RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { input, select } from "@inquirer/prompts";
import { bech32Validator, dateInFutureValidator, positiveBigIntValidator, waitIndicator } from "../utils/utils.js";
import { mkSourceMap } from "../utils/experimental-features/source-map.js";
import { DelayPaymentParameters, delayPaymentTemplate, mkDelayPayment } from "./marlowe-object.js";

// When this script is called, start with main.
main();

async function main() {
    const config = await readConfig();
    const lucid = await Lucid.new(new Blockfrost(config.blockfrostUrl, config.blockfrostProjectId), config.network);
    lucid.selectWalletFromSeed(config.seedPhraseNami);
    const rewardAddressStr = await lucid.wallet.rewardAddress();
    const rewardAddress = rewardAddressStr ? stakeAddressBech32(rewardAddressStr) : undefined;
    const runtimeURL = config.runtimeURL;
  
    const wallet = mkLucidWallet(lucid);
  
    const lifecycle = mkRuntimeLifecycle({
      runtimeURL,
      wallet,
    });
    try {
      await mainLoop(lifecycle, rewardAddress);
    } catch (e) {
      console.log(`Error : ${JSON.stringify(e, null, 4)}`);
    }
  }

  async function mainLoop(lifecycle: RuntimeLifecycle, rewardAddress?: StakeAddressBech32) {
    try {
      while (true) {
        const address = (await lifecycle.wallet.getUsedAddresses())[0];
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
            await createContractMenu(lifecycle, rewardAddress);            
            break;
          case "load":
            // await loadContractMenu(lifecycle);
            console.log("load");
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
export async function createContractMenu(lifecycle: RuntimeLifecycle, rewardAddress?: StakeAddressBech32) {
  const payee = addressBech32(
    await input({
      message: "Enter the payee address",
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

  const walletAddress = (await lifecycle.wallet.getUsedAddresses())[0];
  console.log(`Making a delayed payment:\n * from  ${walletAddress}\n * to ${payee}\n * for ${amount} lovelaces\n`);
  console.log(
    `The payment must be deposited before ${depositDeadline} and can be released to the payee after ${releaseDeadline}`
  );
  if (rewardAddress) {
    console.log(`In the meantime, the contract will stake rewards to ${rewardAddress}`);
  }

  const scheme: DelayPaymentParameters = {
    payer: walletAddress,
    payee,
    amount,
    depositDeadline,
    releaseDeadline,
  };
  const metadata = delayPaymentTemplate.toMetadata(scheme);
  const sourceMap = await mkSourceMap(lifecycle, mkDelayPayment(scheme));
  const contractInstance = await sourceMap.createContract({
    stakeAddress: rewardAddress,
    tags: { DELAY_PAYMENT_VERSION: "2" },
    metadata,
  });

  console.log(`Contract created with id ${contractInstance.id}`);

  await waitIndicator(lifecycle.wallet, contractIdToTxId(contractInstance.id));
  // await contractInstance.waitForConfirmation();

  // return contractMenu(lifecycle.wallet, contractInstance, scheme, sourceMap);
  console.log(`Contract with id ${contractInstance.id} in the blockchain`)
}


import { TxId } from "@marlowe.io/runtime-core";
import { WalletAPI } from "@marlowe.io/wallet";
import { C } from "lucid-cardano";

/**
 * This is an Inquirer.js validator for bech32 addresses
 * @returns true if the address is valid, or a string with the error message otherwise
 */
export function bech32Validator(value: string) {
    try {
      C.Address.from_bech32(value);
      return true;
    } catch (e) {
      return "Invalid address";
    }
  }

  /**
 * This is an Inquirer.js validator for positive bigints
 * @returns true if the value is a positive bigint, or a string with the error message otherwise
 */
export function positiveBigIntValidator(value: string) {
    try {
      if (BigInt(value) > 0) {
        return true;
      } else {
        return "The amount must be greater than 0";
      }
    } catch (e) {
      return "The amount must be a number";
    }
  }

  /**
 * This is an Inquirer.js validator for dates in the future
 * '2024-05-17T06:06:00-03:00'
 * @returns true if the value is a date in the future, or a string with the error message otherwise
 */
export function dateInFutureValidator(value: string) {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return "Invalid date";
    }
    if (d <= new Date()) {
      return "The date must be in the future";
    }
    return true;
  }

  /**
 * Small command line utility that prints a confirmation message and writes dots until the transaction is confirmed
 * NOTE: If we make more node.js cli tools, we should move this to a common place
 */
export async function waitIndicator(wallet: WalletAPI, txId: TxId) {
    process.stdout.write("Waiting for the transaction to be confirmed...");
    const intervalId = setInterval(() => {
      process.stdout.write(".");
    }, 1000);
    await wallet.waitConfirmation(txId);
    clearInterval(intervalId);
    process.stdout.write("\n");
  }
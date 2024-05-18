import { TxId } from "@marlowe.io/runtime-core";
import { WalletAPI } from "@marlowe.io/wallet";
/**
 * This is an Inquirer.js validator for bech32 addresses
 * @returns true if the address is valid, or a string with the error message otherwise
 */
export declare function bech32Validator(value: string): true | "Invalid address";
/**
* This is an Inquirer.js validator for positive bigints
* @returns true if the value is a positive bigint, or a string with the error message otherwise
*/
export declare function positiveBigIntValidator(value: string): true | "The amount must be greater than 0" | "The amount must be a number";
/**
* This is an Inquirer.js validator for dates in the future
* '2024-05-18T08:50:00-03:00'
* @returns true if the value is a date in the future, or a string with the error message otherwise
*/
export declare function dateInFutureValidator(value: string): true | "Invalid date" | "The date must be in the future";
/**
* Small command line utility that prints a confirmation message and writes dots until the transaction is confirmed
* NOTE: If we make more node.js cli tools, we should move this to a common place
*/
export declare function waitIndicator(wallet: WalletAPI, txId: TxId): Promise<void>;
//# sourceMappingURL=utils.d.ts.map
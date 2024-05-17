// region Delay Payment Contract
import { mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { lovelace, close } from "@marlowe.io/marlowe-object";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import { mkSourceMap } from "../utils/experimental-features/source-map.js";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts/lib/index.js";
const DelayPaymentAnnotationsGuard = t.union([
    t.literal("initialDeposit"),
    t.literal("WaitForRelease"),
    t.literal("PaymentMissedClose"),
    t.literal("PaymentReleasedClose"),
]);
export const delayPaymentTemplate = mkMarloweTemplate({
    name: "Delayed payment",
    description: "In a delay payment, a `payer` transfer an `amount` of ADA to the `payee` which can be redeemed after a `releaseDeadline`. While the payment is held by the contract, it can be staked to the payer, to generate pasive income while the payee has the guarantees that the money will be released.",
    params: [
        {
            name: "payer",
            description: "Who is making the payment",
            type: "address",
        },
        {
            name: "payee",
            description: "Who is receiving the payment",
            type: "address",
        },
        {
            name: "amount",
            description: "The amount of lovelaces to be paid",
            type: "value",
        },
        {
            name: "depositDeadline",
            description: "The deadline for the payment to be made. If the payment is not made by this date, the contract can be closed",
            type: "date",
        },
        {
            name: "releaseDeadline",
            description: "A date after the payment can be released to the receiver. NOTE: An empty transaction must be done to close the contract",
            type: "date",
        },
    ],
});
export function mkDelayPayment(scheme) {
    return {
        main: "initial-deposit",
        objects: {
            "release-funds": {
                type: "contract",
                value: {
                    annotation: "WaitForRelease",
                    when: [],
                    timeout: datetoTimeout(scheme.releaseDeadline),
                    timeout_continuation: close("PaymentReleasedClose"),
                },
            },
            "initial-deposit": {
                type: "contract",
                value: {
                    annotation: "initialDeposit",
                    when: [
                        {
                            case: {
                                party: { address: scheme.payer },
                                deposits: BigInt(scheme.amount),
                                of_token: lovelace,
                                into_account: { address: scheme.payee },
                            },
                            then: {
                                ref: "release-funds",
                            },
                        },
                    ],
                    timeout: datetoTimeout(scheme.depositDeadline),
                    timeout_continuation: close("PaymentMissedClose"),
                },
            },
        },
    };
}
export async function delayPaymentValidation(lifecycle, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await lifecycle.restClient.getContractById({
        contractId,
    });
    const scheme = delayPaymentTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    // If the contract seems to be an instance of the contract we want (meanin, we were able
    // to retrieve the contract scheme) we check that the actual initial contract has the same
    // sources.
    // This has 2 purposes:
    //   1. Make sure we are interacting with the expected contract
    //   2. Share the same sources between different Runtimes.
    //      When a contract source is uploaded to the runtime, it merkleizes the source code,
    //      but it doesn't share those sources with other runtime instances. One option would be
    //      to download the sources from the initial runtime and share those with another runtime.
    //      Or this option which doesn't require runtime to runtime communication, and just requires
    //      the dapp to be able to recreate the same sources.
    const sourceMap = await mkSourceMap(lifecycle, mkDelayPayment(scheme));
    const isInstanceof = await sourceMap.contractInstanceOf(contractId);
    if (!isInstanceof) {
        return "InvalidContract";
    }
    return { scheme, sourceMap };
}
export function delayPaymentGetState(currenTime, history, sourceMap) {
    const Annotated = ObjG.Annotated(DelayPaymentAnnotationsGuard);
    const txOut = sourceMap.playHistory(history);
    if ("transaction_error" in txOut) {
        throw new Error(`Error playing history: ${txOut.transaction_error}`);
    }
    if (!Annotated.is(txOut.contract)) {
        throw new Error(`Contract is not annotated`);
    }
    switch (txOut.contract.annotation) {
        case "initialDeposit":
            if (currenTime > txOut.contract.timeout) {
                return { type: "PaymentMissed" };
            }
            else {
                return { type: "InitialState" };
            }
        case "WaitForRelease":
            if (currenTime > txOut.contract.timeout) {
                return { type: "PaymentReady" };
            }
            else {
                return { type: "PaymentDeposited" };
            }
        case "PaymentMissedClose":
            return { type: "Closed", result: "Missed deposit" };
        case "PaymentReleasedClose":
            return { type: "Closed", result: "Payment released" };
    }
}
export function delayPaymentPrintState(state, scheme) {
    switch (state.type) {
        case "InitialState":
            console.log(`Waiting ${scheme.payer} to deposit ${scheme.amount}`);
            break;
        case "PaymentDeposited":
            console.log(`Payment deposited, waiting until ${scheme.releaseDeadline} to be able to release the payment`);
            break;
        case "PaymentMissed":
            console.log(`Payment missed on ${scheme.depositDeadline}, contract can be closed to retrieve minUTXO`);
            break;
        case "PaymentReady":
            console.log(`Payment ready to be released`);
            break;
        case "Closed":
            console.log(`Contract closed: ${state.result}`);
            break;
    }
}
//# sourceMappingURL=delay-payment.js.map
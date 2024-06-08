import { mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { lovelace, close } from "@marlowe.io/marlowe-object";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import { addressBech32 } from "@marlowe.io/runtime-core";
import { mkSourceMap, mkSourceMapRest } from "../utils/experimental-features/source-map.js";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts";
export const projectTag = { MARLOWE_ESCROW1: {} };
const ProjectAnnotationsGuard = t.union([
    t.literal("initialDeposit"),
    t.literal("WaitForRelease"),
    t.literal("PaymentMissedClose"),
    t.literal("PaymentReleasedClose"),
    t.literal("PaymentCancelClose"),
]);
export const projectTemplate = mkMarloweTemplate({
    name: "Fund my project",
    description: "Fund projects that are making the Cardano Community grow!!!",
    params: [
        {
            name: "auditor",
            description: "Who is auditing the contract",
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
        {
            name: "projectName",
            description: "The name of the project",
            type: "string",
        },
        {
            name: "githubUrl",
            description: "The link of the project GITHUB repository",
            type: "string",
        },
    ],
});
const address1 = addressBech32("addr_test1qzjx6xzkz3l58r6t24fjn3r0ygvn87d2fwdrdlfvpvfpjvjwladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8s8xegh6");
const address2 = addressBech32("addr_test1qz87c32zumms5lp64fgmsucaucq0muhuu9u4fjeaxzed486wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8shd2max");
const address3 = addressBech32("addr_test1qzvanymmffg7h75erjm99d7t7pq9efzgmjw683ndmkzzxa6wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8ssmglnl");
const address4 = addressBech32("addr_test1qz6cs6t683eg49f9d7d8hayq89k5rd4kuh5xdym3sgscqw6wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8s7ltg0z");
const address5 = addressBech32("addr_test1qr36c9ccg8j6e4qda5tk0e97j6yxgh3txrufz79r8y4nutjwladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8slvtwst");
const address6 = addressBech32("addr_test1qzwkamtf40cxr9tth7fz087e8f8ynr5vr7why3nw8r0d4r2wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8svmp6cn");
const address7 = addressBech32("addr_test1qp6ypxq3wsgy69cz0qkmcmdfrr330rv7hhcxl9pla2gj6c2wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8sqm8fh6");
export function mkProject(scheme) {
    return {
        main: "initial-deposit",
        objects: {
            payment: {
                type: "contract",
                value: {
                    from_account: { address: scheme.payee },
                    to: { account: { role_token: "payer" } },
                    pay: {
                        amount_of_token: lovelace,
                        in_account: { address: scheme.payee },
                    },
                    token: lovelace,
                    then: close("PaymentCancelClose"),
                },
            },
            "release-funds": {
                type: "contract",
                value: {
                    annotation: "WaitForRelease",
                    when: [
                        {
                            case: {
                                choose_between: [{ from: 1n, to: 1n }],
                                for_choice: {
                                    choice_name: "cancel",
                                    choice_owner: { role_token: "auditor" },
                                },
                            },
                            then: {
                                ref: "payment",
                            },
                        },
                    ],
                    timeout: datetoTimeout(scheme.releaseDeadline),
                    timeout_continuation: {
                        from_account: { address: scheme.payee },
                        to: { party: { address: address1 } },
                        pay: {
                            divide: {
                                amount_of_token: lovelace,
                                in_account: { address: scheme.payee },
                            },
                            by: 7n,
                        },
                        token: lovelace,
                        then: {
                            from_account: { address: scheme.payee },
                            to: { party: { address: address2 } },
                            pay: {
                                divide: {
                                    amount_of_token: lovelace,
                                    in_account: { address: scheme.payee },
                                },
                                by: 6n,
                            },
                            token: lovelace,
                            then: {
                                from_account: { address: scheme.payee },
                                to: { party: { address: address3 } },
                                pay: {
                                    divide: {
                                        amount_of_token: lovelace,
                                        in_account: { address: scheme.payee },
                                    },
                                    by: 5n,
                                },
                                token: lovelace,
                                then: {
                                    from_account: { address: scheme.payee },
                                    to: { party: { address: address4 } },
                                    pay: {
                                        divide: {
                                            amount_of_token: lovelace,
                                            in_account: { address: scheme.payee },
                                        },
                                        by: 4n,
                                    },
                                    token: lovelace,
                                    then: {
                                        from_account: { address: scheme.payee },
                                        to: { party: { address: address5 } },
                                        pay: {
                                            divide: {
                                                amount_of_token: lovelace,
                                                in_account: { address: scheme.payee },
                                            },
                                            by: 3n,
                                        },
                                        token: lovelace,
                                        then: {
                                            from_account: { address: scheme.payee },
                                            to: { party: { address: address6 } },
                                            pay: {
                                                divide: {
                                                    amount_of_token: lovelace,
                                                    in_account: { address: scheme.payee },
                                                },
                                                by: 2n,
                                            },
                                            token: lovelace,
                                            then: {
                                                from_account: { address: scheme.payee },
                                                to: { party: { address: address7 } },
                                                pay: {
                                                    divide: {
                                                        amount_of_token: lovelace,
                                                        in_account: { address: scheme.payee },
                                                    },
                                                    by: 1n,
                                                },
                                                token: lovelace,
                                                then: close("PaymentReleasedClose"),
                                            },
                                        }
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "initial-deposit": {
                type: "contract",
                value: {
                    annotation: "initialDeposit",
                    when: [
                        {
                            case: {
                                party: { role_token: "payer" },
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
//use when both wallet API and address
export async function projectMetadata(restClient, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await restClient.getContractById({
        contractId,
    });
    const scheme = projectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const stateMarlowe = contractDetails.state;
    return { scheme, stateMarlowe };
}
//use when wallet API
export async function projectValidation(lifecycle, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await lifecycle.restClient.getContractById({
        contractId,
    });
    const scheme = projectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const sourceMap = await mkSourceMap(lifecycle, mkProject(scheme));
    const isInstanceof = await sourceMap.contractInstanceOf(contractId);
    if (!isInstanceof) {
        return "InvalidContract";
    }
    return { scheme, sourceMap };
}
//use when both wallet API and address
export function projectGetState(currenTime, history, sourceMap) {
    const Annotated = ObjG.Annotated(ProjectAnnotationsGuard);
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
                return { type: "PaymentMissed", txSuccess: txOut };
            }
            else {
                return { type: "InitialState", txSuccess: txOut };
            }
        case "WaitForRelease":
            if (currenTime > txOut.contract.timeout) {
                return { type: "PaymentReady", txSuccess: txOut };
            }
            else {
                return { type: "PaymentDeposited", txSuccess: txOut };
            }
        case "PaymentMissedClose":
            return { type: "Closed", result: "Missed deposit", txSuccess: txOut };
        case "PaymentReleasedClose":
            return { type: "Closed", result: "Payment released", txSuccess: txOut };
        case "PaymentCancelClose":
            return { type: "Closed", result: "Payment canceled", txSuccess: txOut };
    }
}
//use when both wallet API and address
export function projectStatePlus(state, scheme) {
    switch (state.type) {
        case "InitialState":
            console.log(`Waiting for Payer to deposit ${scheme.amount}`);
            return { printResult: `Waiting for role "Payer" to deposit ${scheme.amount}` };
        case "PaymentDeposited":
            console.log(`Payment deposited, waiting until ${scheme.releaseDeadline} to be able to release the payment`);
            return { printResult: `Payment deposited, waiting until ${scheme.releaseDeadline} to be able to release the payment` };
        case "PaymentMissed":
            console.log(`Payment missed on ${scheme.depositDeadline}, contract can be closed to retrieve minUTXO`);
            return { printResult: `Payment missed on ${scheme.depositDeadline}, contract can be closed to retrieve minUTXO` };
        case "PaymentReady":
            console.log(`Payment ready to be released`);
            return { printResult: `Payment ready to be released` };
        case "Closed":
            console.log(`Contract closed: ${state.result}`);
            return { printResult: `Contract closed: ${state.result}` };
    }
}
//use when wallet API only (no option for wallet address)
export function projectGetOpenRoleActions(applicableAction, contractState) {
    return [
        {
            name: "Re-check contract state",
            value: { type: "check-state" },
        },
        ...applicableAction.actions.map((action) => {
            switch (action.type) {
                case "Deposit":
                    return {
                        name: `Deposit ${action.deposit.deposits} lovelaces`,
                        value: action,
                    };
                default:
                    throw new Error("Unexpected action type");
            }
        }),
        {
            name: "Return to main menu",
            value: { type: "return" },
        },
    ];
}
//use when wallet API only (no option for wallet address)
export function projectGetMyActions(applicableAction, contractState) {
    return [
        {
            name: "Re-check contract state",
            value: { type: "check-state" },
        },
        ...applicableAction.myActions.map((action) => {
            switch (action.type) {
                case "Advance":
                    return {
                        name: "Close contract",
                        description: contractState.type == "PaymentMissed"
                            ? "The payer will receive minUTXO"
                            : "The payer will receive minUTXO and the payee will receive the payment",
                        value: action,
                    };
                case "Choice":
                    return {
                        name: `Option to cancel the contract`,
                        value: action,
                    };
                default:
                    throw new Error("Unexpected action type");
            }
        }),
        {
            name: "Return to main menu",
            value: { type: "return" },
        },
    ];
}
//use when wallet address (sourceMap with no create contract option)
export async function projectValidationRest(restClient, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await restClient.getContractById({
        contractId,
    });
    const scheme = projectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const sourceMap = await mkSourceMapRest(restClient, mkProject(scheme));
    const isInstanceof = await sourceMap.contractInstanceOf(contractId);
    if (!isInstanceof) {
        return "InvalidContract";
    }
    return { scheme, sourceMap };
}
//# sourceMappingURL=paymentSplitter.js.map
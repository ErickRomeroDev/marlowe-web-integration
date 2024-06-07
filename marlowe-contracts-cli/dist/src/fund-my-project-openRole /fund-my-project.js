import { mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { lovelace, close } from "@marlowe.io/marlowe-object";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import { mkSourceMap, mkSourceMapRest } from "../utils/experimental-features/source-map.js";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts";
export const fundMyProjectTag = { CONTRACT_VERSION_3: {} };
const FundMyProjectAnnotationsGuard = t.union([
    t.literal("initialDeposit"),
    t.literal("PaymentMissedClose"),
    t.literal("PaymentReleasedClose"),
]);
export const fundMyProjectTemplate = mkMarloweTemplate({
    name: "Fund my project",
    description: "Fund projects that are making the Cardano Community grow!!!",
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
export function mkFundMyProject(scheme) {
    return {
        main: "initial-deposit",
        objects: {
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
                            then: close("PaymentReleasedClose"),
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
export async function fundMyProjectMetadata(restClient, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await restClient.getContractById({
        contractId,
    });
    const scheme = fundMyProjectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const stateMarlowe = contractDetails.state;
    return { scheme, stateMarlowe };
}
//use when wallet API
export async function fundMyProjectValidation(lifecycle, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await lifecycle.restClient.getContractById({
        contractId,
    });
    const scheme = fundMyProjectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const sourceMap = await mkSourceMap(lifecycle, mkFundMyProject(scheme));
    const isInstanceof = await sourceMap.contractInstanceOf(contractId);
    if (!isInstanceof) {
        return "InvalidContract";
    }
    return { scheme, sourceMap };
}
//use when both wallet API and address
export function fundMyProjectGetState(currenTime, history, sourceMap) {
    const Annotated = ObjG.Annotated(FundMyProjectAnnotationsGuard);
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
        case "PaymentMissedClose":
            return { type: "Closed", result: "Missed deposit", txSuccess: txOut };
        case "PaymentReleasedClose":
            return { type: "Closed", result: "Payment released", txSuccess: txOut };
    }
}
//use when both wallet API and address
export function fundMyProjectStatePlus(state, scheme) {
    switch (state.type) {
        case "InitialState":
            console.log(`Waiting ${scheme.payer} to deposit ${scheme.amount}`);
            return { printResult: `Waiting for role "Payer" to deposit ${scheme.amount}` };
        case "PaymentMissed":
            console.log(`Payment missed on ${scheme.depositDeadline}, contract can be closed to retrieve minUTXO`);
            return { printResult: `Payment missed on ${scheme.depositDeadline}, contract can be closed to retrieve minUTXO` };
        case "Closed":
            console.log(`Contract closed: ${state.result}`);
            return { printResult: `Contract closed: ${state.result}` };
    }
}
//use when wallet API only (no option for wallet address)
export function fundMyProjectGetActions(applicableAction, contractState) {
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
                        description: "Receive minUTXO",
                        value: action,
                    };
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
//use when wallet address (sourceMap with no create contract option)
export async function fundMyProjectValidationRest(restClient, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await restClient.getContractById({
        contractId,
    });
    const scheme = fundMyProjectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const sourceMap = await mkSourceMapRest(restClient, mkFundMyProject(scheme));
    const isInstanceof = await sourceMap.contractInstanceOf(contractId);
    if (!isInstanceof) {
        return "InvalidContract";
    }
    return { scheme, sourceMap };
}
//# sourceMappingURL=fund-my-project.js.map
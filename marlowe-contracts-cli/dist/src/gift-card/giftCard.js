import { mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { lovelace, close } from "@marlowe.io/marlowe-object";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
import { mkSourceMap } from "../utils/experimental-features/source-map.js";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts";
import { mintRole } from "@marlowe.io/runtime-rest-client/contract";
const projectTag = { GIFTCARD: {} };
const tags_array = ["GIFTCARD"];
const ProjectAnnotationsGuard = t.union([t.literal("initialDeposit"), t.literal("PaymentMissedClose"), t.literal("PaymentReleasedClose")]);
const projectTemplate = mkMarloweTemplate({
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
            name: "beneficiaryName",
            description: "The name of the beneficiary",
            type: "string",
        },
    ],
});
function mkBundle(scheme) {
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
                                party: { address: scheme.payer },
                                deposits: BigInt(scheme.amount),
                                of_token: lovelace,
                                into_account: { role_token: "payee" },
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
async function projectValidationMetadata(lifecycle, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await lifecycle.restClient.getContractById({
        contractId,
    });
    const scheme = projectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const contractInstance = await lifecycle.newContractAPI.load(contractId);
    return { scheme, contractDetails, contractInstance };
}
async function projectValidationSource(lifecycle, contractId) {
    // First we try to fetch the contract details and the required tags
    const contractDetails = await lifecycle.restClient.getContractById({
        contractId,
    });
    const scheme = projectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
        return "InvalidMarloweTemplate";
    }
    const sourceMap = await mkSourceMap(lifecycle, mkBundle(scheme));
    const isInstanceof = await sourceMap.contractInstanceOf(contractId);
    if (!isInstanceof) {
        return "InvalidContract";
    }
    const contractInstance = await lifecycle.newContractAPI.load(contractId);
    return { scheme, contractDetails, contractInstance, sourceMap };
}
async function projectGetState(currenTime, contractInstance, sourceMap) {
    const inputHistory = await contractInstance.getInputHistory();
    const Annotated = ObjG.Annotated(ProjectAnnotationsGuard);
    const txOut = sourceMap.playHistory(inputHistory);
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
function projectGetStatePlus(state, scheme) {
    switch (state.type) {
        case "InitialState":
            console.log(`Waiting ${scheme.payer} to deposit ${scheme.amount}`);
            return { printResult: `Waiting ${scheme.payer} to deposit ${scheme.amount}` };
        case "PaymentMissed":
            console.log(`Payment missed on ${scheme.depositDeadline}, contract can be closed to retrieve minUTXO`);
            return { printResult: `Payment missed on ${scheme.depositDeadline}, contract can be closed to retrieve minUTXO` };
        case "Closed":
            console.log(`Contract closed: ${state.result}`);
            return { printResult: `Contract closed: ${state.result}` };
    }
}
async function projectGetMyActions(contractInstance, state) {
    const applicableAction = await contractInstance.evaluateApplicableActions();
    return [
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
    ];
}
//projectGetActions (for contracts that will be filtered to be on Open Roles turn)
export async function mkContract(schema, runtimeLifecycle, rewardAddress) {
    const tokenMetadata = {
        name: `${schema.beneficiaryName}-GIFT-CARD`,
        description: "Gift Card present",
        image: "ipfs://QmaQMH7ybS9KmdYQpa4FMtAhwJH5cNaacpg4fTwhfPvcwj",
        mediaType: "image/png",
        files: [
            {
                name: `${schema.beneficiaryName}-GIFT-CARD`,
                mediaType: "image/webp",
                src: "ipfs://QmUbvavFxGSSEo3ipQf7rjrELDvXHDshWkHZSpV8CVdSE5",
            },
        ],
    };
    const metadata = projectTemplate.toMetadata(schema);
    const sourceMap = await mkSourceMap(runtimeLifecycle, mkBundle(schema));
    const contractInstance = await sourceMap.createContract({
        stakeAddress: rewardAddress,
        tags: projectTag,
        metadata,
        roles: { payee: mintRole(schema.payee, 1n, tokenMetadata) },
    });
    return contractInstance;
}
export async function getContractsByAddress(runtimeLifecycle, range) {
    const [walletAddress] = await runtimeLifecycle.wallet.getUsedAddresses();
    let contractsRequest;
    if (range) {
        contractsRequest = {
            tags: tags_array,
            partyAddresses: [walletAddress],
            range: range,
        };
    }
    else {
        contractsRequest = {
            tags: tags_array,
            partyAddresses: [walletAddress],
        };
    }
    const contractHeaders = await runtimeLifecycle.restClient.getContracts(contractsRequest);
    const page = contractHeaders.page;
    const contractInfoBasic = await Promise.all(contractHeaders.contracts.map(async (item) => {
        const result = await projectValidationMetadata(runtimeLifecycle, item.contractId);
        if (result === "InvalidMarloweTemplate") {
            return null;
        }
        return {
            header: item,
            scheme: result.scheme,
            contractDetails: result.contractDetails,
            contractInstance: result.contractInstance,
        };
    }));
    return { contractInfoBasic, page };
}
export async function getContractsByToken(tokenAssetName, runtimeLifecycle, range) {
    let contractsRequest;
    if (range) {
        contractsRequest = {
            tags: tags_array,
            range: range,
        };
    }
    else {
        contractsRequest = {
            tags: tags_array,
        };
    }
    const contractHeaders = await runtimeLifecycle.restClient.getContracts(contractsRequest);
    const walletTokens = await runtimeLifecycle.wallet.getTokens();
    const page = contractHeaders.page;
    //filter those contracts that have Policy ID, if they dont have one they have ""
    const filteredByRoleTokenMintingPolicy = contractHeaders.contracts.filter((header) => header.roleTokenMintingPolicyId);
    //predicate
    const filteredByWalletTokens = (header) => {
        return walletTokens.some((item) => item.assetId.policyId === header.roleTokenMintingPolicyId && item.assetId.assetName === tokenAssetName);
    };
    //filter by tokens on the wallet
    const contractHeaderFilteredByWallet = filteredByRoleTokenMintingPolicy.filter((header) => filteredByWalletTokens(header));
    const contractInfoBasic = await Promise.all(contractHeaderFilteredByWallet.map(async (item) => {
        const result = await projectValidationMetadata(runtimeLifecycle, item.contractId);
        if (result === "InvalidMarloweTemplate") {
            return null;
        }
        return {
            header: item,
            scheme: result.scheme,
            contractDetails: result.contractDetails,
            contractInstance: result.contractInstance,
        };
    }));
    return { contractInfoBasic, page };
}
//get Contracts by Open Roles
export async function getContractInfoPlus(id, runtimeLifecycle) {
    const cid = id;
    const result = await projectValidationSource(runtimeLifecycle, cid);
    if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
        return null;
    }
    const state = await projectGetState(datetoTimeout(new Date()), result.contractInstance, result.sourceMap);
    const myChoices = await projectGetMyActions(result.contractInstance, state);
    const statePlus = projectGetStatePlus(state, result.scheme);
    const contractInfo = {
        scheme: result.scheme,
        contractDetails: result.contractDetails,
        contractInstance: result.contractInstance,
        state,
        statePlus,
        myChoices,
    };
    return contractInfo;
}
//getCOntractInfloPlusOpenRole  - change  the myChoices with choices using the projectGetActions function
export async function applyInputDeposit(contractInfo, value) {
    const applicableActions = await contractInfo?.contractInstance.evaluateApplicableActions();
    const applicableInput = await applicableActions.toInput(value);
    const txId = await applicableActions.apply({
        input: applicableInput,
    });
    return txId;
}
//apply for choices
export async function existContractId(contractId, runtimeLifecycle) {
    await runtimeLifecycle.restClient.getContractById({
        contractId: contractId,
    });
}
//# sourceMappingURL=giftCard.js.map
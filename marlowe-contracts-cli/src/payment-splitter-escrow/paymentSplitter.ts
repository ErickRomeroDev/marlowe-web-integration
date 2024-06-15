import { TemplateParametersOf, mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { ContractBundleMap, lovelace, close } from "@marlowe.io/marlowe-object";
import {When, datetoTimeout } from "@marlowe.io/language-core-v1";
import { CanAdvance, CanChoose, CanDeposit, ContractInstanceAPI,  RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId, StakeAddressBech32, Tags, TxId } from "@marlowe.io/runtime-core";
import { SourceMap, SourceMapRest, mkSourceMap } from "../utils/experimental-features/source-map.js";
import { POSIXTime } from "@marlowe.io/adapter/time";
import { TransactionSuccess } from "@marlowe.io/language-core-v1/semantics";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts";
import { ItemRange, Page } from "@marlowe.io/runtime-rest-client";
import { ContractDetails, ContractHeader, GetContractsRequest, mintRole } from "@marlowe.io/runtime-rest-client/contract";

const projectTag: Tags = { PAYMENT_SPLITTER: {} };
const tags_array = ["PAYMENT_SPLITTER"];

export type ProjectParameters = TemplateParametersOf<typeof projectTemplate>;
type ProjectAnnotations = "initialDeposit" | "WaitForRelease" | "PaymentMissedClose" | "PaymentReleasedClose" | "PaymentCancelClose";

type ProjectValidationSourceResults =
  | "InvalidMarloweTemplate"
  | "InvalidContract"
  | {
      scheme: ProjectParameters;
      contractDetails: ContractDetails;
      contractInstance: ContractInstanceAPI;
      sourceMap: SourceMap<ProjectAnnotations>;
    };

export type ContractInfoPlus = {
  scheme: ProjectParameters;
  contractDetails: ContractDetails;
  contractInstance: ContractInstanceAPI;
  state: ProjectState;
  statePlus: any;
  myChoices: ProjectActions;
} | null;

type ProjectValidationMetadataResults =
  | "InvalidMarloweTemplate"
  | {
      scheme: ProjectParameters;
      contractDetails: ContractDetails;
      contractInstance: ContractInstanceAPI;
    };

export type ContractInfoBasic = {
  header: ContractHeader;
  scheme: ProjectParameters;
  contractDetails: ContractDetails;
  contractInstance: ContractInstanceAPI;
} | null;

type ProjectState = InitialState | PaymentDeposited | PaymentMissed | PaymentReady | Closed;

type InitialState = {
  type: "InitialState";
  txSuccess: TransactionSuccess;
};
type PaymentDeposited = {
  type: "PaymentDeposited";
  txSuccess: TransactionSuccess;
};
type PaymentMissed = {
  type: "PaymentMissed";
  txSuccess: TransactionSuccess;
};
type PaymentReady = {
  type: "PaymentReady";
  txSuccess: TransactionSuccess;
};
type Closed = {
  type: "Closed";
  result: "Missed deposit" | "Payment released" | "Payment canceled";
  txSuccess: TransactionSuccess;
};

const ProjectAnnotationsGuard = t.union([
  t.literal("initialDeposit"),
  t.literal("WaitForRelease"),
  t.literal("PaymentMissedClose"),
  t.literal("PaymentReleasedClose"),
  t.literal("PaymentCancelClose"),
]);

export type ProjectActions = Array<{
  name: string;
  description?: string;
  value: CanDeposit | CanAdvance | CanChoose;
}>;

const projectTemplate = mkMarloweTemplate({
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
      name: "payee2",
      description: "Who is receiving the payment",
      type: "address",
    },
    {
      name: "payee3",
      description: "Who is receiving the payment",
      type: "address",
    },
    {
      name: "payee4",
      description: "Who is receiving the payment",
      type: "address",
    },
    {
      name: "payee5",
      description: "Who is receiving the payment",
      type: "address",
    },
    {
      name: "payee6",
      description: "Who is receiving the payment",
      type: "address",
    },
    {
      name: "payee7",
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
      description:
        "A date after the payment can be released to the receiver. NOTE: An empty transaction must be done to close the contract",
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
  ] as const,
});

// const address1 = addressBech32("addr_test1qzjx6xzkz3l58r6t24fjn3r0ygvn87d2fwdrdlfvpvfpjvjwladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8s8xegh6");
// const address2 = addressBech32("addr_test1qz87c32zumms5lp64fgmsucaucq0muhuu9u4fjeaxzed486wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8shd2max");
// const address3 = addressBech32("addr_test1qzvanymmffg7h75erjm99d7t7pq9efzgmjw683ndmkzzxa6wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8ssmglnl");
// const address4 = addressBech32("addr_test1qz6cs6t683eg49f9d7d8hayq89k5rd4kuh5xdym3sgscqw6wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8s7ltg0z");
// const address5 = addressBech32("addr_test1qr36c9ccg8j6e4qda5tk0e97j6yxgh3txrufz79r8y4nutjwladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8slvtwst");
// const address6 = addressBech32("addr_test1qzwkamtf40cxr9tth7fz087e8f8ynr5vr7why3nw8r0d4r2wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8svmp6cn");
// const address7 = addressBech32("addr_test1qp6ypxq3wsgy69cz0qkmcmdfrr330rv7hhcxl9pla2gj6c2wladqsndw3y6r3t5ra7ecys6uplm0glyx24kvfm9t5x8sqm8fh6");


function mkBundle(scheme: ProjectParameters): ContractBundleMap<ProjectAnnotations> {
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
            to: { party: { address: scheme.payee } },
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
              to: { party: { address: scheme.payee2 } },
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
                to: { party: { address: scheme.payee3 } },
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
                  to: { party: { address: scheme.payee4 } },
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
                    to: { party: { address: scheme.payee5 } },
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
                      to: { party: { address: scheme.payee6 } },
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
                        to: { party: { address: scheme.payee7 } },
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

async function projectValidationMetadata(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<ProjectValidationMetadataResults> {
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

async function projectValidationSource(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<ProjectValidationSourceResults> {
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

async function projectGetState(
  currenTime: POSIXTime,
  contractInstance: ContractInstanceAPI,
  sourceMap: SourceMap<ProjectAnnotations> | SourceMapRest<ProjectAnnotations>
): Promise<ProjectState> {
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
      if (currenTime > (txOut.contract as When).timeout) {
        return { type: "PaymentMissed", txSuccess: txOut };
      } else {
        return { type: "InitialState", txSuccess: txOut };
      }
    case "WaitForRelease":
      if (currenTime > (txOut.contract as When).timeout) {
        return { type: "PaymentReady", txSuccess: txOut };
      } else {
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

function projectGetStatePlus(state: ProjectState, scheme: ProjectParameters) {
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

async function projectGetMyActions(contractInstance: ContractInstanceAPI, state: ProjectState): Promise<ProjectActions> {
  const applicableAction = await contractInstance.evaluateApplicableActions();
  return [
    ...applicableAction.myActions.map((action) => {
      switch (action.type) {
        case "Advance":
          return {
            name: "Close contract",
            description:
              state.type == "PaymentMissed"
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
  ];
}

//for contracts that will be filtered to be on Open Roles turn
async function projectGetActions(contractInstance: ContractInstanceAPI, state: ProjectState): Promise<ProjectActions> {
  const applicableAction = await contractInstance.evaluateApplicableActions();
  return [
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
  ];
}

export async function mkContract(
  schema: ProjectParameters,
  runtimeLifecycle: RuntimeLifecycle,
  rewardAddress?: StakeAddressBech32
): Promise<ContractInstanceAPI> {
  const tokenVCMetadata = {
    name: "VC Token",
    description: "These tokens give access to deposit on the contract",
    image: "ipfs://QmaQMH7ybS9KmdYQpa4FMtAhwJH5cNaacpg4fTwhfPvcwj",
    mediaType: "image/png",
    files: [
      {
        name: "VC Token",
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
        name: "Auditor Token",
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
    roles: {
      payer: mintRole("OpenRole", 1n, tokenVCMetadata),
      auditor: mintRole(schema.auditor, 1n, tokenAuditorMetadata),
    },
  });
  return contractInstance;
}

export async function getContractsByAddress(  
  runtimeLifecycle: RuntimeLifecycle,
  range?: ItemRange
): Promise<{
  contractInfoBasic: ContractInfoBasic[];
  page: Page;
}> {  
  const walletAddress = await runtimeLifecycle.wallet.getUsedAddresses();
  let contractsRequest: GetContractsRequest;
  if (range) {
    contractsRequest = {
      tags: tags_array,
      partyAddresses: walletAddress,
      range: range,
    };
  } else {
    contractsRequest = {
      tags: tags_array,
      partyAddresses: walletAddress,
    };
  }

  const contractHeaders = await runtimeLifecycle.restClient.getContracts(contractsRequest);
  const page = contractHeaders.page;

  const contractInfoBasic = await Promise.all(
    contractHeaders.contracts.map(async (item) => {
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
    })
  );

  return { contractInfoBasic, page };
}

export async function getContractsByToken(
  tokenAssetName: string,
  runtimeLifecycle: RuntimeLifecycle,
  range?: ItemRange
): Promise<{
  contractInfoBasic: ContractInfoBasic[];
  page: Page;
}> {
  let contractsRequest: GetContractsRequest;
  if (range) {
    contractsRequest = {
      tags: tags_array,
      range: range,
    };
  } else {
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
  const filteredByWalletTokens = (header: ContractHeader): boolean => {
    return walletTokens.some(
      (item) => item.assetId.policyId === header.roleTokenMintingPolicyId && item.assetId.assetName === tokenAssetName
    );
  };

  //filter by tokens on the wallet
  const contractHeaderFilteredByWallet = filteredByRoleTokenMintingPolicy.filter((header) => filteredByWalletTokens(header));

  const contractInfoBasic = await Promise.all(
    contractHeaderFilteredByWallet.map(async (item) => {
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
    })
  );

  return { contractInfoBasic, page };
}

export async function getContractsByOpenRole(
  runtimeLifecycle: RuntimeLifecycle,
  range?: ItemRange
): Promise<{
  contractInfoBasic: ContractInfoBasic[];
  page: Page;
}> {
  let contractsRequest: GetContractsRequest;
  if (range) {
    contractsRequest = {
      tags: tags_array,
      range: range,
    };
  } else {
    contractsRequest = {
      tags: tags_array,
    };
  }

  const contractHeaders = await runtimeLifecycle.restClient.getContracts(contractsRequest);
  const page = contractHeaders.page;

  //filter those contracts that have Policy ID, if they dont have one they have ""
  const filteredByRoleTokenMintingPolicy = contractHeaders.contracts.filter((header) => header.roleTokenMintingPolicyId);

  //predicate
  const filteredByOpenRole = async (header: ContractHeader): Promise<boolean> => {
    const contractInstance = await runtimeLifecycle.newContractAPI.load(header.contractId);
    const details = await contractInstance.getDetails();
    if (details.type === "closed") {
      return false;
    }
    const history = await contractInstance.getInputHistory();
    const applicableActions = await runtimeLifecycle.applicableActions.getApplicableActions(details);
    const depositAvailable = applicableActions.some((item) => item.type === "Deposit");

    if (history.length === 0 && depositAvailable) {
      return true;
    } else {
      return false;
    }
  };

  //filter by Open Roles
  const contractHeaderFilteredByWallet = filteredByRoleTokenMintingPolicy.filter((header) => filteredByOpenRole(header));

  const contractInfoBasic = await Promise.all(
    contractHeaderFilteredByWallet.map(async (item) => {
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
    })
  );

  return { contractInfoBasic, page };
}

export async function getContractInfoPlus(id: string, runtimeLifecycle: RuntimeLifecycle): Promise<ContractInfoPlus> {
  const cid = id as ContractId;

  const result = await projectValidationSource(runtimeLifecycle, cid);
  if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
    return null;
  }

  const state = await projectGetState(datetoTimeout(new Date()), result.contractInstance, result.sourceMap);
  const myChoices = await projectGetMyActions(result.contractInstance, state);
  const statePlus = projectGetStatePlus(state, result.scheme);

  const contractInfo: ContractInfoPlus = {
    scheme: result.scheme,
    contractDetails: result.contractDetails,
    contractInstance: result.contractInstance,
    state,
    statePlus,
    myChoices,
  };

  return contractInfo;
}

export async function getContractInfloPlusOpenRole(id: string, runtimeLifecycle: RuntimeLifecycle): Promise<ContractInfoPlus> {
  const cid = id as ContractId;

  const result = await projectValidationSource(runtimeLifecycle, cid);
  if (result === "InvalidMarloweTemplate" || result === "InvalidContract") {
    return null;
  }

  const state = await projectGetState(datetoTimeout(new Date()), result.contractInstance, result.sourceMap);
  const choices = await projectGetActions(result.contractInstance, state);
  const statePlus = projectGetStatePlus(state, result.scheme);

  const contractInfo: ContractInfoPlus = {
    scheme: result.scheme,
    contractDetails: result.contractDetails,
    contractInstance: result.contractInstance,
    state,
    statePlus,
    myChoices: choices,
  };
  return contractInfo;
}

export async function applyInputDeposit(contractInfo: ContractInfoPlus, value: CanDeposit | CanAdvance): Promise<TxId> {
  const applicableActions = await contractInfo?.contractInstance.evaluateApplicableActions();
  const applicableInput = await applicableActions!.toInput(value);
  const txId = await applicableActions!.apply({
    input: applicableInput,
  });
  return txId;
}

export async function applyInputChoice(contractInfo: ContractInfoPlus, value: CanChoose): Promise<TxId> {
  const applicableActions = await contractInfo?.contractInstance.evaluateApplicableActions();
  const applicableInput = await applicableActions!.toInput(value, 1n);
  const txId = await applicableActions!.apply({
    input: applicableInput,
  });
  return txId;
}

//apply for notify

export async function existContractId(contractId: string, runtimeLifecycle: RuntimeLifecycle) {
  await runtimeLifecycle.restClient.getContractById({
    contractId: contractId as ContractId,
  });
}

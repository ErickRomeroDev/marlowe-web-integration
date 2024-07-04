import { TemplateParametersOf, mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { ContractBundleMap, lovelace, close } from "@marlowe.io/marlowe-object";
import { When, datetoTimeout, PolicyId } from "@marlowe.io/language-core-v1";
import { CanAdvance, CanDeposit, ContractInstanceAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId, StakeAddressBech32, Tags, TxId } from "@marlowe.io/runtime-core";
import { SourceMap, mkSourceMap } from "./experimental-features/source-map";
import { POSIXTime } from "@marlowe.io/adapter/time";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts";
import { ItemRange, Page } from "@marlowe.io/runtime-rest-client";
import { ContractDetails, ContractHeader, GetContractsRequest, mintRole } from "@marlowe.io/runtime-rest-client/contract";

const projectTag: Tags = { VESTING: {} };
export const tags_array = ["VESTING"];

export type ProjectParameters = TemplateParametersOf<typeof projectTemplate>;
type ProjectAnnotations = "initialDeposit" | "WaitForRelease" | "PaymentMissedClose" | "PaymentReleasedClose";

const ProjectAnnotationsGuard = t.union([
  t.literal("initialDeposit"),
  t.literal("WaitForRelease"),
  t.literal("PaymentMissedClose"),
  t.literal("PaymentReleasedClose"),
]);

export type ProjectState = InitialState | PaymentDeposited | PaymentMissed | PaymentReady | Closed;

type InitialState = {
  type: "InitialState";
};
type PaymentDeposited = {
  type: "PaymentDeposited";
};
type PaymentMissed = {
  type: "PaymentMissed";
};
type PaymentReady = {
  type: "PaymentReady";
};
type Closed = {
  type: "Closed";
  result: "Missed deposit" | "Payment released";
};

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
  choices: ProjectActions;
} | null;

export type ContractInfoPlusToRunInServer = {
  scheme: ProjectParameters;
  state: ProjectState;
  statePlus: any;
  hasOpenRole: boolean;
  id: string;
  policyId: PolicyId;
} | null;

export type ContractInfoPlusToRunInClient = {
  contractDetails: ContractDetails;
  contractInstance: ContractInstanceAPI;
  myChoices: ProjectActions;
  choices: ProjectActions;
};

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

export type ProjectActions = Array<{
  name: string;
  description?: string;
  value: CanDeposit | CanAdvance | null;
}>;

export const projectTemplate = mkMarloweTemplate({
  name: "Fund my project",
  description: "Fund projects that are making the Cardano Community grow!!!",
  params: [
    {
      name: "creator",
      description: "Who is creating the contract",
      type: "address",
    },
    {
      name: "creationTime",
      description: "When the contract is being created",
      type: "date",
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

function mkBundle(scheme: ProjectParameters): ContractBundleMap<ProjectAnnotations> {
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

export async function projectValidationSource(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<ProjectValidationSourceResults> {
  // First we try to fetch the contract details and the required tags
  try {
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
  } catch {
    return "InvalidMarloweTemplate";
  }
}

export async function projectGetState(
  currenTime: POSIXTime,
  contractInstance: ContractInstanceAPI,
  sourceMap: SourceMap<ProjectAnnotations>
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
        return { type: "PaymentMissed" };
      } else {
        return { type: "InitialState" };
      }
    case "WaitForRelease":
      if (currenTime > (txOut.contract as When).timeout) {
        return { type: "PaymentReady"};
      } else {
        return { type: "PaymentDeposited"};
      }
    case "PaymentMissedClose":
      return { type: "Closed", result: "Missed deposit"};
    case "PaymentReleasedClose":
      return { type: "Closed", result: "Payment released"};
  }
}

export function projectGetStatePlus(state: ProjectState, scheme: ProjectParameters) {
  switch (state.type) {
    case "InitialState":
      console.log(`Waiting Open Role VC to deposit ${scheme.amount}`);
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

export async function projectGetMyActions(contractInstance: ContractInstanceAPI, state: ProjectState): Promise<ProjectActions> {
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

export async function projectGetActions(contractInstance: ContractInstanceAPI, state: ProjectState): Promise<ProjectActions> {
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
  const tokenMetadata = {
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
  const metadata = projectTemplate.toMetadata(schema);
  console.log("metadata",metadata)
  const sourceMap = await mkSourceMap(runtimeLifecycle, mkBundle(schema));
  console.log("sourceMap",sourceMap)
  const contractInstance = await sourceMap.createContract({   
    stakeAddress: rewardAddress,
    tags: projectTag,
    metadata,
    roles: { payer: mintRole("OpenRole", 1n, tokenMetadata) },
  });
  console.log("contractInstance", contractInstance)
  return contractInstance;
}

export async function applyInputDeposit(contractInstance: ContractInstanceAPI, value: CanDeposit | CanAdvance): Promise<TxId> {
  const applicableActions = await contractInstance.evaluateApplicableActions();
  const applicableInput = await applicableActions!.toInput(value);
  const txId = await applicableActions!.apply({
    input: applicableInput,
  });
  return txId;
}

//apply for choices

//apply for notify

export async function existContractId(contractId: string, runtimeLifecycle: RuntimeLifecycle) {
  await runtimeLifecycle.restClient.getContractById({
    contractId: contractId as ContractId,
  });
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

  //Open Role
  let hasOpenRole: boolean;
  if (state.type === "InitialState") {
    hasOpenRole = true;
  } else {
    hasOpenRole = false;
  } 

  let choices: ProjectActions;
  if (hasOpenRole) {
    choices = await projectGetActions(result.contractInstance, state);
  } else {
    choices = [
      {
        name: "open Roles",
        value: null,
      },
    ];
  }

  const contractInfo: ContractInfoPlus = {
    scheme: result.scheme,
    contractDetails: result.contractDetails,
    contractInstance: result.contractInstance,
    state,
    statePlus,
    myChoices,
    choices,
  };

  return contractInfo;
}

export async function projectValidationMetadata(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<ProjectValidationMetadataResults> {
  // First we try to fetch the contract details and the required tags
  try {
    const contractDetails = await lifecycle.restClient.getContractById({
      contractId,
    });
    const scheme = projectTemplate.fromMetadata(contractDetails.metadata);
    if (!scheme) {
      return "InvalidMarloweTemplate";
    }
    const contractInstance = await lifecycle.newContractAPI.load(contractId);
    return { scheme, contractDetails, contractInstance };
  } catch {
    return "InvalidMarloweTemplate";
  }
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

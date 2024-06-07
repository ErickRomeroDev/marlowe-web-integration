import { TemplateParametersOf, mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { ContractBundleMap, lovelace, close } from "@marlowe.io/marlowe-object";
import { MarloweState, When, datetoTimeout } from "@marlowe.io/language-core-v1";
import { CanAdvance, CanDeposit, NewApplicableActionsAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId, Tags } from "@marlowe.io/runtime-core";
import { SourceMap, SourceMapRest, mkSourceMap, mkSourceMapRest } from "../utils/experimental-features/source-map.js";
import { POSIXTime } from "@marlowe.io/adapter/time";
import { SingleInputTx, TransactionSuccess } from "@marlowe.io/language-core-v1/semantics";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts";
import { RestClient } from "@marlowe.io/runtime-rest-client";

export const projectTag: Tags = { CONTRACT_VERSION_3: {} };

export type ProjectParameters = TemplateParametersOf<typeof projectTemplate>;
export type ProjectAnnotations = "initialDeposit" | "WaitForRelease" | "PaymentMissedClose" | "PaymentReleasedClose";

export type ProjectValidationResults =
  | "InvalidMarloweTemplate"
  | "InvalidContract"
  | {
      scheme: ProjectParameters;
      sourceMap: SourceMap<ProjectAnnotations>;
    };

export type ProjectValidationResultsRest =
  | "InvalidMarloweTemplate"
  | "InvalidContract"
  | {
      scheme: ProjectParameters;
      sourceMap: SourceMapRest<ProjectAnnotations>;
    };

export type ProjectMetadataResults =
  | "InvalidMarloweTemplate"
  | {
      scheme: ProjectParameters;
      stateMarlowe: MarloweState | undefined;
    };

export type ProjectState = InitialState | PaymentDeposited | PaymentMissed | PaymentReady | Closed;

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
  result: "Missed deposit" | "Payment released";
  txSuccess: TransactionSuccess;
};

const ProjectAnnotationsGuard = t.union([
  t.literal("initialDeposit"),
  t.literal("WaitForRelease"),
  t.literal("PaymentMissedClose"),
  t.literal("PaymentReleasedClose"),
]);

export type ProjectActions = Array<{
  name: string;
  description?: string;
  value: CanDeposit | CanAdvance | { type: "check-state" } | { type: "return" };
}>;

export const projectTemplate = mkMarloweTemplate({
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

export function mkProject(scheme: ProjectParameters): ContractBundleMap<ProjectAnnotations> {
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

//use when both wallet API and address
export async function projectMetadata(restClient: RestClient, contractId: ContractId): Promise<ProjectMetadataResults> {
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
export async function projectValidation(
  lifecycle: RuntimeLifecycle,
  contractId: ContractId
): Promise<ProjectValidationResults> {
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
export function projectGetState(
  currenTime: POSIXTime,
  history: SingleInputTx[],
  sourceMap: SourceMap<ProjectAnnotations> | SourceMapRest<ProjectAnnotations>
): ProjectState {
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
  }
}

//use when both wallet API and address
export function projectStatePlus(state: ProjectState, scheme: ProjectParameters) {
  switch (state.type) {
    case "InitialState":
      console.log(`Waiting ${scheme.payer} to deposit ${scheme.amount}`);
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
export function projectGetActions(
  applicableAction: NewApplicableActionsAPI,
  contractState: ProjectState
): ProjectActions {
  return [
    {
      name: "Re-check contract state",
      value: { type: "check-state" },
    },
    ...applicableAction.actions.map((action) => {
      switch (action.type) {
        case "Advance":
          return {
            name: "Close contract",
            description: contractState.type == "PaymentMissed"
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
    {
      name: "Return to main menu",
      value: { type: "return" },
    },
  ];
}

//use when wallet address (sourceMap with no create contract option)
export async function projectValidationRest(
  restClient: RestClient,
  contractId: ContractId
): Promise<ProjectValidationResultsRest> {
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

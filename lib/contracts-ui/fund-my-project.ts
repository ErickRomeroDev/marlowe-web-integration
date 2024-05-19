import { TemplateParametersOf, mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { ContractBundleMap, lovelace, close } from "@marlowe.io/marlowe-object";
import { When, datetoTimeout } from "@marlowe.io/language-core-v1";
import { CanAdvance, CanDeposit, NewApplicableActionsAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId, Tags } from "@marlowe.io/runtime-core";
import { SourceMap, SourceMapRest, mkSourceMap, mkSourceMapRest } from "./experimental-features/source-map";
import { POSIXTime } from "@marlowe.io/adapter/time";
import { SingleInputTx } from "@marlowe.io/language-core-v1/semantics";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import * as t from "io-ts";
import { RestClient } from "@marlowe.io/runtime-rest-client";

export const fundMyProjectTag: Tags = { FUND_MY_PROJECT_VERSION_2: {}, "FILTER-VERSION_1": { contracts: "normal", vcs: "registered" } };

export type FundMyProjectParameters = TemplateParametersOf<typeof fundMyProjectTemplate>;
export type FundMyProjectAnnotations = "initialDeposit" | "PaymentMissedClose" | "PaymentReleasedClose";

export type FundMyProjectValidationResults =
  | "InvalidMarloweTemplate"
  | "InvalidContract"
  | {
      scheme: FundMyProjectParameters;
      sourceMap: SourceMap<FundMyProjectAnnotations>;
    };

export type FundMyProjectValidationResultsRest =
  | "InvalidMarloweTemplate"
  | "InvalidContract"
  | {
      scheme: FundMyProjectParameters;
      sourceMap: SourceMapRest<FundMyProjectAnnotations>;
    };

export type FundMyProjectState = InitialState | PaymentMissed | Closed;

type InitialState = {
  type: "InitialState";
};
type PaymentMissed = {
  type: "PaymentMissed";
};
type Closed = {
  type: "Closed";
  result: "Missed deposit" | "Payment released";
};

const FundMyProjectAnnotationsGuard = t.union([
  t.literal("initialDeposit"),
  t.literal("PaymentMissedClose"),
  t.literal("PaymentReleasedClose"),
]);

export type FundMyProjectActions = Array<{
  name: string;
  description?: string;
  value: CanDeposit | CanAdvance | { type: "check-state" } | { type: "return" };
}>;

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
  ] as const,
});

export function mkFundMyProject(scheme: FundMyProjectParameters): ContractBundleMap<FundMyProjectAnnotations> {
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

//use when wallet API
export async function fundMyProjectValidation(
  lifecycle: RuntimeLifecycle,
  contractId: ContractId
): Promise<FundMyProjectValidationResults> {
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
export function fundMyProjectGetState(
  currenTime: POSIXTime,
  history: SingleInputTx[],
  sourceMap: SourceMap<FundMyProjectAnnotations> | SourceMapRest<FundMyProjectAnnotations>
): FundMyProjectState {
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
      if (currenTime > (txOut.contract as When).timeout) {
        return { type: "PaymentMissed" };
      } else {
        return { type: "InitialState" };
      }
    case "PaymentMissedClose":
      return { type: "Closed", result: "Missed deposit" };
    case "PaymentReleasedClose":
      return { type: "Closed", result: "Payment released" };
  }
}

//use when both wallet API and address
export function fundMyProjectPrintState(state: FundMyProjectState, scheme: FundMyProjectParameters) {
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

//use when wallet API only (no option for wallet address)
export function fundMyProjectGetActions(
  applicableAction: NewApplicableActionsAPI,
  contractState: FundMyProjectState
): FundMyProjectActions {
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
export async function fundMyProjectValidationRest(
  restClient: RestClient,
  contractId: ContractId
): Promise<FundMyProjectValidationResultsRest> {
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

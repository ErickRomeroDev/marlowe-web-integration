import { TemplateParametersOf } from "@marlowe.io/marlowe-template";
import { ContractBundleMap } from "@marlowe.io/marlowe-object";
import { MarloweState } from "@marlowe.io/language-core-v1";
import { CanAdvance, CanDeposit, NewApplicableActionsAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId, Tags } from "@marlowe.io/runtime-core";
import { SourceMap, SourceMapRest } from "../utils/experimental-features/source-map.js";
import { POSIXTime } from "@marlowe.io/adapter/time";
import { SingleInputTx, TransactionSuccess } from "@marlowe.io/language-core-v1/semantics";
import * as t from "io-ts";
import { RestClient } from "@marlowe.io/runtime-rest-client";
export declare const fundMyProjectTag: Tags;
export type FundMyProjectParameters = TemplateParametersOf<typeof fundMyProjectTemplate>;
export type FundMyProjectAnnotations = "initialDeposit" | "PaymentMissedClose" | "PaymentReleasedClose";
export type FundMyProjectValidationResults = "InvalidMarloweTemplate" | "InvalidContract" | {
    scheme: FundMyProjectParameters;
    sourceMap: SourceMap<FundMyProjectAnnotations>;
};
export type FundMyProjectValidationResultsRest = "InvalidMarloweTemplate" | "InvalidContract" | {
    scheme: FundMyProjectParameters;
    sourceMap: SourceMapRest<FundMyProjectAnnotations>;
};
export type FundMyProjectMetadataResults = "InvalidMarloweTemplate" | {
    scheme: FundMyProjectParameters;
    stateMarlowe: MarloweState | undefined;
};
export type FundMyProjectState = InitialState | PaymentMissed | Closed;
type InitialState = {
    type: "InitialState";
    txSuccess: TransactionSuccess;
};
type PaymentMissed = {
    type: "PaymentMissed";
    txSuccess: TransactionSuccess;
};
type Closed = {
    type: "Closed";
    result: "Missed deposit" | "Payment released";
    txSuccess: TransactionSuccess;
};
export type FundMyProjectActions = Array<{
    name: string;
    description?: string;
    value: CanDeposit | CanAdvance | {
        type: "check-state";
    } | {
        type: "return";
    };
}>;
export declare const fundMyProjectTemplate: import("@marlowe.io/marlowe-template").MarloweTemplate<{
    payer: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    payee: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    amount: import("@marlowe.io/adapter/bigint").BigIntOrNumber;
    depositDeadline: Date;
    projectName: string;
    githubUrl: string;
}>;
export declare function mkFundMyProject(scheme: FundMyProjectParameters): ContractBundleMap<FundMyProjectAnnotations>;
export declare function fundMyProjectMetadata(restClient: RestClient, contractId: ContractId): Promise<FundMyProjectMetadataResults>;
export declare function fundMyProjectValidation(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<FundMyProjectValidationResults>;
export declare function fundMyProjectGetState(currenTime: POSIXTime, history: SingleInputTx[], sourceMap: SourceMap<FundMyProjectAnnotations> | SourceMapRest<FundMyProjectAnnotations>): FundMyProjectState;
export declare function fundMyProjectStatePlus(state: FundMyProjectState, scheme: FundMyProjectParameters): {
    printResult: string;
};
export declare function fundMyProjectGetActions(applicableAction: NewApplicableActionsAPI, contractState: FundMyProjectState): FundMyProjectActions;
export declare function fundMyProjectValidationRest(restClient: RestClient, contractId: ContractId): Promise<FundMyProjectValidationResultsRest>;
export {};
//# sourceMappingURL=fund-my-project.d.ts.map
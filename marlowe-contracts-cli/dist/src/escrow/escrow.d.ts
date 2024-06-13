import { TemplateParametersOf } from "@marlowe.io/marlowe-template";
import { ContractBundleMap } from "@marlowe.io/marlowe-object";
import { MarloweState } from "@marlowe.io/language-core-v1";
import { CanAdvance, CanChoose, CanDeposit, NewApplicableActionsAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId, Tags } from "@marlowe.io/runtime-core";
import { SourceMap, SourceMapRest } from "../utils/experimental-features/source-map.js";
import { POSIXTime } from "@marlowe.io/adapter/time";
import { SingleInputTx, TransactionSuccess } from "@marlowe.io/language-core-v1/semantics";
import * as t from "io-ts";
import { RestClient } from "@marlowe.io/runtime-rest-client";
export declare const projectTag: Tags;
export type ProjectParameters = TemplateParametersOf<typeof projectTemplate>;
export type ProjectAnnotations = "initialDeposit" | "WaitForRelease" | "PaymentMissedClose" | "PaymentReleasedClose" | "PaymentCancelClose";
export type ProjectValidationResults = "InvalidMarloweTemplate" | "InvalidContract" | {
    scheme: ProjectParameters;
    sourceMap: SourceMap<ProjectAnnotations>;
};
export type ProjectValidationResultsRest = "InvalidMarloweTemplate" | "InvalidContract" | {
    scheme: ProjectParameters;
    sourceMap: SourceMapRest<ProjectAnnotations>;
};
export type ProjectMetadataResults = "InvalidMarloweTemplate" | {
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
    result: "Missed deposit" | "Payment released" | "Payment canceled";
    txSuccess: TransactionSuccess;
};
export type ProjectActions = Array<{
    name: string;
    description?: string;
    value: CanDeposit | CanAdvance | CanChoose | {
        type: "check-state";
    } | {
        type: "return";
    };
}>;
export declare const projectTemplate: import("@marlowe.io/marlowe-template").MarloweTemplate<{
    payee: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    amount: import("@marlowe.io/adapter/bigint").BigIntOrNumber;
    depositDeadline: Date;
    releaseDeadline: Date;
    projectName: string;
    githubUrl: string;
    auditor: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
}>;
export declare function mkProject(scheme: ProjectParameters): ContractBundleMap<ProjectAnnotations>;
export declare function projectMetadata(restClient: RestClient, contractId: ContractId): Promise<ProjectMetadataResults>;
export declare function projectValidation(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<ProjectValidationResults>;
export declare function projectGetState(currenTime: POSIXTime, history: SingleInputTx[], sourceMap: SourceMap<ProjectAnnotations> | SourceMapRest<ProjectAnnotations>): ProjectState;
export declare function projectStatePlus(state: ProjectState, scheme: ProjectParameters): {
    printResult: string;
};
export declare function projectGetOpenRoleActions(applicableAction: NewApplicableActionsAPI, contractState: ProjectState): ProjectActions;
export declare function projectGetMyActions(applicableAction: NewApplicableActionsAPI, contractState: ProjectState): ProjectActions;
export declare function projectValidationRest(restClient: RestClient, contractId: ContractId): Promise<ProjectValidationResultsRest>;
export {};
//# sourceMappingURL=escrow.d.ts.map
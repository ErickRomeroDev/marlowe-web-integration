import { TemplateParametersOf } from "@marlowe.io/marlowe-template";
import { ContractBundleMap } from "@marlowe.io/marlowe-object";
import { CanAdvance, CanDeposit, NewApplicableActionsAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId, Tags } from "@marlowe.io/runtime-core";
import { SourceMap } from "../utils/experimental-features/source-map.js";
import { POSIXTime } from "@marlowe.io/adapter/time";
import { SingleInputTx } from "@marlowe.io/language-core-v1/semantics";
import * as t from "io-ts/lib/index.js";
export declare const fundMyProjectTag: Tags;
export type FundMyProjectParameters = TemplateParametersOf<typeof fundMyProjectTemplate>;
export type FundMyProjectAnnotations = "initialDeposit" | "PaymentMissedClose" | "PaymentReleasedClose";
export type FundMyProjectValidationResults = "InvalidMarloweTemplate" | "InvalidContract" | {
    scheme: FundMyProjectParameters;
    sourceMap: SourceMap<FundMyProjectAnnotations>;
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
export declare function fundMyProjectValidation(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<FundMyProjectValidationResults>;
export declare function fundMyProjectGetState(currenTime: POSIXTime, history: SingleInputTx[], sourceMap: SourceMap<FundMyProjectAnnotations>): FundMyProjectState;
export declare function fundMyProjectPrintState(state: FundMyProjectState, scheme: FundMyProjectParameters): {
    printResult: string;
};
export declare function fundMyProjectGetActions(applicableAction: NewApplicableActionsAPI, contractState: FundMyProjectState): FundMyProjectActions;
export {};
//# sourceMappingURL=fund-my-project.d.ts.map
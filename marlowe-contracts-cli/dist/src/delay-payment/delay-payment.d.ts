import { TemplateParametersOf } from "@marlowe.io/marlowe-template";
import { ContractBundleMap } from "@marlowe.io/marlowe-object";
import { CanAdvance, CanDeposit, NewApplicableActionsAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractId } from "@marlowe.io/runtime-core";
import { SourceMap } from "../utils/experimental-features/source-map.js";
import { POSIXTime } from "@marlowe.io/adapter/time";
import { SingleInputTx } from "@marlowe.io/language-core-v1/semantics";
import * as t from "io-ts";
export type DelayPaymentParameters = TemplateParametersOf<typeof delayPaymentTemplate>;
export type DelayPaymentAnnotations = "initialDeposit" | "WaitForRelease" | "PaymentMissedClose" | "PaymentReleasedClose";
export type DelayPaymentValidationResults = "InvalidMarloweTemplate" | "InvalidContract" | {
    scheme: DelayPaymentParameters;
    sourceMap: SourceMap<DelayPaymentAnnotations>;
};
export type DelayPaymentState = InitialState | PaymentDeposited | PaymentMissed | PaymentReady | Closed;
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
export type DelaypaymentActions = Array<{
    name: string;
    description?: string;
    value: CanDeposit | CanAdvance | {
        type: "check-state";
    } | {
        type: "return";
    };
}>;
export declare const delayPaymentTemplate: import("@marlowe.io/marlowe-template").MarloweTemplate<{
    payer: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    payee: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    amount: import("@marlowe.io/adapter/bigint").BigIntOrNumber;
    depositDeadline: Date;
    releaseDeadline: Date;
}>;
export declare function mkDelayPayment(scheme: DelayPaymentParameters): ContractBundleMap<DelayPaymentAnnotations>;
export declare function delayPaymentValidation(lifecycle: RuntimeLifecycle, contractId: ContractId): Promise<DelayPaymentValidationResults>;
export declare function delayPaymentGetState(currenTime: POSIXTime, history: SingleInputTx[], sourceMap: SourceMap<DelayPaymentAnnotations>): DelayPaymentState;
export declare function delayPaymentPrintState(state: DelayPaymentState, scheme: DelayPaymentParameters): void;
export declare function delayPaymentGetActions(applicableAction: NewApplicableActionsAPI, contractState: DelayPaymentState): DelaypaymentActions;
export {};
//# sourceMappingURL=delay-payment.d.ts.map
import { TemplateParametersOf } from "@marlowe.io/marlowe-template";
import { ContractBundleMap } from "@marlowe.io/marlowe-object";
export type DelayPaymentParameters = TemplateParametersOf<typeof delayPaymentTemplate>;
export type DelayPaymentAnnotations = "initialDeposit" | "WaitForRelease" | "PaymentMissedClose" | "PaymentReleasedClose";
export declare const delayPaymentTemplate: import("@marlowe.io/marlowe-template").MarloweTemplate<{
    payer: import("io-ts").Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    payee: import("io-ts").Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    amount: import("@marlowe.io/adapter/bigint").BigIntOrNumber;
    depositDeadline: Date;
    releaseDeadline: Date;
}>;
export declare function mkDelayPayment(scheme: DelayPaymentParameters): ContractBundleMap<DelayPaymentAnnotations>;
//# sourceMappingURL=marlowe-object.d.ts.map
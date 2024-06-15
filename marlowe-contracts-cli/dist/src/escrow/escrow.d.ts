import { TemplateParametersOf } from "@marlowe.io/marlowe-template";
import { CanAdvance, CanChoose, CanDeposit, ContractInstanceAPI, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { StakeAddressBech32, TxId } from "@marlowe.io/runtime-core";
import { TransactionSuccess } from "@marlowe.io/language-core-v1/semantics";
import * as t from "io-ts";
import { ItemRange, Page } from "@marlowe.io/runtime-rest-client";
import { ContractDetails, ContractHeader } from "@marlowe.io/runtime-rest-client/contract";
export type ProjectParameters = TemplateParametersOf<typeof projectTemplate>;
export type ContractInfoPlus = {
    scheme: ProjectParameters;
    contractDetails: ContractDetails;
    contractInstance: ContractInstanceAPI;
    state: ProjectState;
    statePlus: any;
    myChoices: ProjectActions;
} | null;
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
export type ProjectActions = Array<{
    name: string;
    description?: string;
    value: CanDeposit | CanAdvance | CanChoose;
}>;
declare const projectTemplate: import("@marlowe.io/marlowe-template").MarloweTemplate<{
    auditor: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    payee: t.Branded<string, import("@marlowe.io/runtime-core").AddressBech32Brand>;
    amount: import("@marlowe.io/adapter/bigint").BigIntOrNumber;
    depositDeadline: Date;
    releaseDeadline: Date;
    projectName: string;
    githubUrl: string;
}>;
export declare function mkContract(schema: ProjectParameters, runtimeLifecycle: RuntimeLifecycle, rewardAddress?: StakeAddressBech32): Promise<ContractInstanceAPI>;
export declare function getContractsByAddress(runtimeLifecycle: RuntimeLifecycle, range?: ItemRange): Promise<{
    contractInfoBasic: ContractInfoBasic[];
    page: Page;
}>;
export declare function getContractsByToken(tokenAssetName: string, runtimeLifecycle: RuntimeLifecycle, range?: ItemRange): Promise<{
    contractInfoBasic: ContractInfoBasic[];
    page: Page;
}>;
export declare function getContractsByOpenRole(runtimeLifecycle: RuntimeLifecycle, range?: ItemRange): Promise<{
    contractInfoBasic: ContractInfoBasic[];
    page: Page;
}>;
export declare function getContractInfoPlus(id: string, runtimeLifecycle: RuntimeLifecycle): Promise<ContractInfoPlus>;
export declare function getContractInfloPlusOpenRole(id: string, runtimeLifecycle: RuntimeLifecycle): Promise<ContractInfoPlus>;
export declare function applyInputDeposit(contractInfo: ContractInfoPlus, value: CanDeposit | CanAdvance): Promise<TxId>;
export declare function applyInputChoice(contractInfo: ContractInfoPlus, value: CanChoose): Promise<TxId>;
export declare function existContractId(contractId: string, runtimeLifecycle: RuntimeLifecycle): Promise<void>;
export {};
//# sourceMappingURL=escrow.d.ts.map
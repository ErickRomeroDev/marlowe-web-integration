import { ContractBundleMap } from "@marlowe.io/marlowe-object";
import { ContractInstanceAPI, CreateContractRequestBase, RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
import { ContractClosure } from "./contract-closure.js";
import { SingleInputTx, TransactionOutput } from "@marlowe.io/language-core-v1/semantics";
import { RestClient } from "@marlowe.io/runtime-rest-client";
import { ContractId } from "@marlowe.io/runtime-core";
export interface SourceMap<T> {
    source: ContractBundleMap<T>;
    closure: ContractClosure;
    annotateHistory(history: SingleInputTx[]): SingleInputTx[];
    playHistory(history: SingleInputTx[]): TransactionOutput;
    createContract(options: CreateContractRequestBase): Promise<ContractInstanceAPI>;
    contractInstanceOf(contractId: ContractId): Promise<boolean>;
}
export declare function mkSourceMap<T>(lifecycle: RuntimeLifecycle, sourceObjectMap: ContractBundleMap<T>): Promise<SourceMap<T>>;
export interface SourceMapRest<T> {
    source: ContractBundleMap<T>;
    closure: ContractClosure;
    annotateHistory(history: SingleInputTx[]): SingleInputTx[];
    playHistory(history: SingleInputTx[]): TransactionOutput;
    contractInstanceOf(contractId: ContractId): Promise<boolean>;
}
export declare function mkSourceMapRest<T>(restClient: RestClient, sourceObjectMap: ContractBundleMap<T>): Promise<SourceMapRest<T>>;
//# sourceMappingURL=source-map.d.ts.map
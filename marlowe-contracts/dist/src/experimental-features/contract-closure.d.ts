import { Contract } from "@marlowe.io/language-core-v1";
import { ContractSourceId } from "@marlowe.io/marlowe-object";
import { RestClient } from "@marlowe.io/runtime-rest-client";
export interface ContractClosure {
    main: string;
    contracts: Map<string, Contract>;
}
type ClosureDI = {
    restClient: RestClient;
};
export declare const getContractClosure: ({ restClient }: ClosureDI) => (contractSourceId: ContractSourceId) => Promise<ContractClosure>;
export {};
//# sourceMappingURL=contract-closure.d.ts.map
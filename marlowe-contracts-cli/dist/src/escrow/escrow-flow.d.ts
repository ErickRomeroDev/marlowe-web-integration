import { StakeAddressBech32 } from "@marlowe.io/runtime-core";
import { RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
export declare function createContractMenu(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle, rewardAddress?: StakeAddressBech32): Promise<void>;
export declare function downloadByOpenRole(lifecycleNami: RuntimeLifecycle): Promise<void>;
export declare function downloadByAddressNami(lifecycleNami: RuntimeLifecycle): Promise<void>;
export declare function downloadByTokenNami(lifecycleNami: RuntimeLifecycle): Promise<void>;
export declare function downloadByAddressLace(lifecycleLace: RuntimeLifecycle): Promise<void>;
export declare function downloadByTokenLace(lifecycleLace: RuntimeLifecycle): Promise<void>;
export declare function downloadPayoutsNami(lifecycleNami: RuntimeLifecycle): Promise<void>;
export declare function withDrawPayoutsNami(lifecycleNami: RuntimeLifecycle): Promise<void>;
export declare function downloadPayoutsLace(lifecycleLace: RuntimeLifecycle): Promise<void>;
export declare function withDrawPayoutsLace(lifecycleLace: RuntimeLifecycle): Promise<void>;
//# sourceMappingURL=escrow-flow.d.ts.map
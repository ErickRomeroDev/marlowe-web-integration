import { StakeAddressBech32 } from "@marlowe.io/runtime-core";
import { RuntimeLifecycle } from "@marlowe.io/runtime-lifecycle/api";
export declare function downloadMenuByToken(lifecycleNami: RuntimeLifecycle): Promise<void>;
export declare function downloadMenuByAddress(lifecycleNami: RuntimeLifecycle): Promise<void>;
/**
 * This is an Inquirer.js flow to create a contract
 * @param lifecycle An instance of the RuntimeLifecycle
 * @param rewardAddress An optional reward address to stake the contract rewards
 */
export declare function createContractMenu(lifecycleNami: RuntimeLifecycle, lifecycleLace: RuntimeLifecycle, rewardAddress?: StakeAddressBech32): Promise<void>;
export declare function downloadPayouts(lifecycleLace: RuntimeLifecycle): Promise<void>;
export declare function withDrawPayouts(lifecycleLace: RuntimeLifecycle): Promise<void>;
//# sourceMappingURL=giftCard-flow.d.ts.map
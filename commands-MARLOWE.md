runtimeLifecycle.applicableActions: {
getApplicableActions(contractDetails: ContractDetails, environment?: Environment): Promise<ApplicableAction[]>;
getInput(contractDetails: ActiveContract, action: CanNotify | CanDeposit | CanAdvance): Promise<ApplicableInput>;
getInput(contractDetails: ActiveContract, action: CanChoose, chosenNum: bigint): Promise<ApplicableInput>;
applyInput(contractId: ContractId, request: ApplyApplicableInputRequest): Promise<TxId>;
mkFilter(contractDetails: ActiveContract): Promise<ApplicableActionsFilter>;
mkFilter(): Promise<ApplicableActionsWithDetailsFilter>;
simulateInput(contractDetails: ActiveContract, input: ApplicableInput): TransactionSuccess
}

runtimeLifecycle.newContractAPI: {
create(request: CreateContractRequest): Promise<ContractInstanceAPI>;
load(id: ContractId): Promise<ContractInstanceAPI>
}

runtimeLifecycle.wallet: {
getChangeAddress(): Promise<Branded<string, AddressBech32Brand>>;
getCollaterals(): Promise<TxOutRef[]>;
getLovelaces(): Promise<bigint>;
getTokens(): Promise<Token[]>;
getUTxOs(): Promise<TxOutRef[]>;
getUsedAddresses(): Promise<Branded<string, AddressBech32Brand>[]>;
isMainnet(): Promise<boolean>;
signTx(tx): Promise<string>;
waitConfirmation(txHash): Promise<boolean>
}

runtimeLifecycle.payouts: {
available(filters?: Filters): Promise<CustomAvailable[]>;
withdraw(payoutIds: PayoutId[]): Promise<void>;
withdrawn(filters?: Filters): Promise<CustomWithdrawn[]>
}

runtimeLifecycle.restAPI: {
  <!-- i did not include all the details, but they are in the documentation -->
}

ContractInstanceAPI: {
getDetails: (() => Promise<ContractDetails>);
id: ContractId;
isActive: (() => Promise<boolean>);
isClosed: (() => Promise<boolean>);
waitForConfirmation: (() => Promise<boolean>);
applyInput: (request: ApplyApplicableInputRequest) => Promise<TxId>;
evaluateApplicableActions: (request?: ComputeApplicableActionsRequest) => Promise<NewApplicableActionsAPI>;
getInputHistory: () => Promise<SingleInputTx[]>
}

NewApplicableActionsAPI: {
actions: ApplicableAction[];
myActions: ApplicableAction[];
apply(req: ApplyApplicableInputRequest): Promise<TxId>;
simulate(input: ApplicableInput): TransactionSuccess;
toInput(action: CanNotify | CanDeposit | CanAdvance): Promise<ApplicableInput>;
toInput(action: CanChoose, chosenNum: bigint): Promise<ApplicableInput>
}

---

Filters: {
    byContractIds: ContractId[];
    byMyRoleTokens: ((myRolesOnWallet) => AssetId[]);
}

CustomAvailable: {
assets: ({ tokens: { quantity: bigint; assetId: { policyId: Branded<string, PolicyIdBrand>; assetName: string; }; }[]; }) & {
lovelaces?: bigint;
};
contractId: Branded<string, ContractIdBrand>;
payoutId: PayoutId;
role: { policyId: Branded<string, PolicyIdBrand>; assetName: string; };
}

CustomWithdrawn: {
    assets: ({ tokens: { quantity: bigint; assetId: { policyId: Branded<string, PolicyIdBrand>; assetName: string; }; }[]; }) & {
        lovelaces?: bigint;
    };
    contractId: Branded<string, ContractIdBrand>;
    payoutId: PayoutId;
    role: { policyId: Branded<string, PolicyIdBrand>; assetName: string; };
    withdrawalId: WithdrawalId;
}

ContractDetails: ClosedContract | ActiveContract

ClosedContract: {
type: "closed";
}

ActiveContract: {
contractId: ContractId;
currentContract: Contract;
currentState: MarloweState;
roleTokenMintingPolicyId: PolicyId;
type: "active";
}

ApplicableAction: CanNotify | CanDeposit | CanChoose | CanAdvance

Contract: Close | Pay | If | When | Let | Assert

MarloweState: {
accounts: Accounts;
boundValues: AssocMap<string, bigint>;
choices: AssocMap<ChoiceId, bigint>;
minTime: bigint
}

Accounts: AssocMap<[AccountId, Token], bigint>

CanNotify: {
environment: Environment;
merkleizedContinuationHash?: string;
type: "Notify"
}

CanDeposit: {
deposit: Deposit
environment: Environment;
merkleizedContinuationHash?: string;
type: "Deposit"
}

CanAdvance: {
environment: Environment;  
 type: "Advance"
}

CanChoose: {
choice: Choice
environment: Environment;
merkleizedContinuationHash?: string;
type: "Choice"
}

Deposit: {
deposits: Value;
into_account: Party;
of_token: Token;
party: Party
}

Choice: {
choose_between: Bound[];
for_choice: ChoiceId
}

ChoiceId: {
choice_name: string;
choice_owner: Party
}

Notify: {
notify_if: Observation
}

ApplyApplicableInputRequest: {
input: ApplicableInput;  
metadata?: Metadata;
tags?: Tags
}

ApplicableInput: {
environment: Environment;
inputs: Input[]
}

Input: NormalInput | MerkleizedInput

NormalInput: IDeposit | IChoice | INotify

MerkleizedInput: MerkleizedDeposit | MerkleizedChoice | MerkleizedNotify

IDeposit: {
input_from_party: Party;
into_account: Party;
of_token: Token;
that_deposits: bigint
}

IChoice: {
for_choice_id: ChoiceId;
input_that_chooses_num: bigint
}

INotify: "input_notify"

MerkleizedDeposit: IDeposit & MerkleizedHashAndContinuation

MerkleizedChoice: IChoice & MerkleizedHashAndContinuation

MerkleizedNotify: MerkleizedHashAndContinuation

MerkleizedHashAndContinuation: {
continuation_hash: string;
merkleized_continuation: Contract
}

TransactionSuccess: {
contract: Contract;
payments: Payment[];
state: MarloweState;
warnings: TransactionWarning[]
}

ApplicableActionsFilter: ((action: ApplicableAction) => boolean)

ApplicableActionsWithDetailsFilter: ((action: ApplicableAction, contractDetails: ActiveContract) => boolean)

CreateContractRequest: CreateContractRequestFromContract | CreateContractRequestFromBundle

CreateContractRequestFromContract: {
accountDeposits?: AccountDeposits;
contract: Contract;
metadata?: Metadata;
minimumLovelaceUTxODeposit?: number;
roles?: RolesConfiguration
stakeAddress?: StakeAddressBech32;
tags?: Tags;
threadRoleName?: string
}

CreateContractRequestFromBundle: {
accountDeposits?: AccountDeposits;
bundle: ContractBundleList<undefined>;
metadata?: Metadata;
minimumLovelaceUTxODeposit?: number;
roles?: RolesConfiguration;
stakeAddress?: StakeAddressBech32;
tags?: Tags;
threadRoleName?: string
}

ComputeApplicableActionsRequest: {
environment?: Environment;
}

SingleInputTx: {
input?: Input;
interval: TimeInterval
}

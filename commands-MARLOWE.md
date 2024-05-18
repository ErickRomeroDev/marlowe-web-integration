runtimeLifecycle.applicableActions: {
computeEnvironment: ((contract: Contract) => Promise<Environment>)
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

restAPI: {
applyInputsToContract(request: ApplyInputsToContractRequest): Promise<TransactionTextEnvelope>;
buildCreateContractTx(request: BuildCreateContractTxRequest): Promise<BuildCreateContractTxResponse>;
createContractSources(request: CreateContractSourcesRequest): Promise<CreateContractSourcesResponse>;
getContractById(request: {contractId: ContractId}): Promise<ContractDetails_de_RESTAPI>;
getContractSourceAdjacency(request: GetContractSourceAdjacencyRequest): Promise<GetContractSourceAdjacencyResponse>;
getContractSourceById(request: GetContractBySourceIdRequest): Promise<Contract>;
getContractSourceClosure(request: GetContractSourceClosureRequest): Promise<GetContractSourceClosureResponse>;
getContractTransactionById(request: GetContractTransactionByIdRequest): Promise<TransactionDetails>
getContracts(request?: GetContractsRequest): Promise<GetContractsResponse>;
getNextStepsForContract(request: {contractId, parties, validityStart, validityEnd}): Promise<{ApplicableInputs, can_reduce}>;
getPayoutById(request: {PayoutId}): Promise<GetPayoutByIdResponse>;
getPayouts(request: {ContractId[], ItemRange, AssetId[], PayoutStatus}): Promise<GetPayoutsResponse>;
getTransactionsForContract(request: {ContractId, range}): Promise<GetTransactionsForContractResponse>;
getWithdrawalById(request: {withdrawalId}): Promise<GetWithdrawalByIdResponse>
getWithdrawals(request?: {AssetId[]}): Promise<withdrawals...>;
healthcheck(): Promise<RuntimeStatus>
submitContract(request: {ContractId, TextEnvelope}): Promise<void>;
submitContractTransaction(request: {ContractId, transactionId, hexTransactionWitnessSet}): Promise<void>
submitWithdrawal(request: {withdrawalId, hexTransactionWitnessSet}): Promise<void>;
withdrawPayouts(request: WithdrawPayoutsRequest): Promise<{ tx: TextEnvelope; withdrawalId: WithdrawalId}>
}

mkSourceMap<T>(lifecycle: RuntimeLifecycle, sourceObjectMap: ContractBundleMap<T>): Promise<SourceMap<T>>

---

SourceMap<T>: {
source: ContractBundleMap;
closure: ContractClosure;
annotateHistory(history: SingleInputTx[]): SingleInputTx[];
playHistory <Annotated> (history: SingleInputTx[]): TransactionOutput;
createContract(options: CreateContractRequestBase): Promise<ContractInstanceAPI>;
contractInstanceOf(contractId: ContractId): Promise<boolean>;
}

ContractClosure <Annotated>: {  
main: string;
contracts: Map<string, Contract>;
}

GetContractsResponse: {
contracts: ContractHeader[];
page: Page
}

ContractHeader: {
block: Option<BlockHeader>;
contractId: ContractId;
metadata: Metadata;
roleTokenMintingPolicyId: Branded<string, PolicyIdBrand>;
status: "unsigned" | "submitted" | "confirmed";
tags: Tags;
version: "v1"
}

GetContractsRequest: {
partyAddresses?: Branded<string, AddressBech32Brand>[];
partyRoles?: { assetName: string; policyId: Branded<string, PolicyIdBrand>}[];
range?: Branded<string, ItemRangeBrand>;
tags?: string[]
}

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

ContractDetails_de_RESTAPI: {
block?: BlockHeader;
contractId: ContractId;
currentContract?: Contract;
initialContract: Contract;
metadata: Metadata;
roleTokenMintingPolicyId: Branded<string, PolicyIdBrand>;
state?: MarloweState;
status: "unsigned" | "submitted" | "confirmed";
tags: Tags;
txBody?: TextEnvelope;
unclaimedPayouts: {payoutId:TxOutRef; role: string;}[];
utxo?: TxOutRef;
version: "v1"
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

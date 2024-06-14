# Marlowe Next Integration

Plug-and-play programable smart contracts controlled by React Components using NEXT web-framework.

## About Marlowe Tool Stack

Marlowe is a powerfull Engine that comes with batteries: financial DSL, Tx-builder, indexers, cardano-node, REST endpoints. This tool stack enable developers to build reliable and cost-effective Dapps.
The REST endpoints follow an OpenAPI specification, and it is recommended to use the TypeScript SDK for communication. The TypeScript SDK serves as a wrapper for the OpenAPI specification, providing additional logic that facilitates the creation and execution of smart contracts, acting as a bridge between the Marlowe runtime and the web application.

[Marlowe](https://marlowe.iohk.io/) home page lists all available tools developed by **IOG**:

- Playground
- Runner
- Runtime v1.0
- MarloweScan
- Typescript SDK.

Some APIs of the TS-SDK v0.4:

- applicableActions
- newContractAPI
- wallet
- payouts
- ContractInstanceAPI
- NewApplicableActionsAPI
- restAPI
- sourceMap

## Project management and milestones progress
https://github.com/users/ErickRomeroDev/projects/3/views/7


## Project Discussions
https://github.com/ErickRomeroDev/marlowe-web-integration/discussions


## Smart Contracts being developed and Features:

Features that can be enabled when using the Typescript SDK.

- Contract as core elements
- Contract as bundle objects: Annotations (experimental feature only available using TS-SDK)
- Template (experimental feature)
- Party as Addresses
- Party as Roles
- Party as Open-Roles
- Custom Oracles or Daemons
- Merklelization
- Wallet 

Procedure for designing, creating, testing and integrating Marlowe smart contract:

- **Design:** It is recommended to perform a basic static analysis of a small representation of your contract using the Playground.
- **Create:** A smart contract can be constructed using Core Contracts elements or Bundle Objects, with the latter offering the option to include annotations. The contract comes with both on-chain and off-chain APIs, enabling a Dapp developer to focus solely on the business logic of the application without needing to worry about how to interact with the smart contract. This separation of concerns simplifies the development process for Dapp developers.
- **Testing:** A contract is tested by simulating its execution and observing the results. This is done by executing the contract using CLI commands to ensure it behaves as expected.
- **Web Integration:** After testing the contract using CLI commands, the web integration process begins. This involves connecting the contract logic with a web framework, ensuring proper integration, incorporating a wallet plugin, and focusing on UI and UX design. Additionally, it includes testing to confirm that the contract executes as expected within the web environment.

Next, we include a list of contracts included in this repository that have been tested using some of the features and procedures mentioned earlier.
Live DAPP is available at this link: https://marlowe-web-integration.vercel.app/

### Deposit Contract

`Description: `

- User can create a deposit intention contract, and perform a deposit right after the contract was created. 
- Purpose: TS-SDK and web integration testing

`Features included:`

- Contract as core elements
- Party as Addresses
- Wallets supported (Nami, Eternl and Lace)

`Procedure:`

- **Design**: https://gist.github.com/ErickRomeroDev/1ae9aa1dc034d10a844fc879e271b653 (this gist can be uploaded directly into Playground for static analysis)
- **Create**: This contract only includes an On-chain API. All contract logic interactions are performed by the Dapp developer (logic written in the component itself)
- **Testing**: This contract was tested directly using Playground only. 
- **Web Integration**: The primary objective of this initial contract was to test the integration of the TypeScript SDK with the Next.js framework, test the wallet plugin, and verify the contract logic through the UI. Additionally, some libraries were structured to enhance the user experience. This contract creation workflow is managed by local state, allowing deposits to be made only immediately after a contract is created.
- **Code** can be found at https://github.com/ErickRomeroDev/marlowe-web-integration/blob/main/app/(dashboard)/(marlowe-contracts)/deposit-test

```typescript
export const mkDepositContract = (amtLovelace: number, alice: Party, bob: Party) => {
  const bintAmount = BigInt(amtLovelace);
  const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
  const inTwentyFourHours = datetoTimeout(new Date(Date.now() + twentyFourHoursInMilliseconds));

  const demoContract: Contract = {
    when: [
      {
        then: "close",
        case: {
          party: alice,
          of_token: lovelace,
          into_account: bob,
          deposits: bintAmount,
        },
      },
    ],
    timeout_continuation: "close",
    timeout: inTwentyFourHours,
  };
  return demoContract;
};
```

### Buy me a Coffee 

`Description:`

- User can request funding to a specific sponsor address. 
- Sponsor can view funding requests and choose to fund those they find appropriate.
- Purpose: Test API that request contracts that are specific to an address and follows a specific tag.

`Features included:`

- Contract as core elements
- Party as Addresses
- Wallets supported (Nami, Eternl and Lace)

`Procedure:`

- **Design:** https://gist.github.com/ErickRomeroDev/1ae9aa1dc034d10a844fc879e271b653 (this gist can be uploaded directly into Playground for static analysis)
- **Create:** This contract only includes an On-chain API. All contract logic interactions are performed by the Dapp developer (logic written in the component itself). The off-chain logic can track the contract and extract its state, allowing it to determine whether the contract has been funded or is still awaiting funding.
- **Testing:** This contract was tested directly using Playground only. 
- **Web Integration:** This contract implementation represents the completion of our first milestone. This first milestone was focused on establishing our foundation for web integration, and this Dapp example confirms the success of this prerequisite. The primary objective of this second contract was to test APIs for loading other contracts filtered by addresses and tags. Additionally, loading times were evaluated to improve user experience. The states and actions for each contract are clearly displayed in the UI.
- **Code** can be found at https://github.com/ErickRomeroDev/marlowe-web-integration/blob/main/app/(dashboard)/(marlowe-contracts)/buy-coffee

```typescript
export const mkDepositContract = (amtLovelace: number, alice: Party, bob: Party) => {
  const bintAmount = BigInt(amtLovelace);
  const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
  const inTwentyFourHours = datetoTimeout(new Date(Date.now() + twentyFourHoursInMilliseconds));

  const demoContract: Contract = {
    when: [
      {
        then: "close",
        case: {
          party: alice,
          of_token: lovelace,
          into_account: bob,
          deposits: bintAmount,
        },
      },
    ],
    timeout_continuation: "close",
    timeout: inTwentyFourHours,
  };
  return demoContract;
};
```

### Fund my project

`Description:`

- A project owner can send a contract containing project-related information to a venture capitalist (VC) for evaluation. The contract includes addresses, amounts, and holding times within its datum. The project owner's name and GitHub URL are sent through the transaction metadata.
- The venture capitalist can view all contracts requesting support and see all related details, including the parameters set during contract creation (addresses, amounts, and time). They can also determine the contract's state and what actions can be taken. 
- A specific contract lookup feature was included for VCs searching for a particular project owner's contract by its ID.
- Purpose: We tested the initialization of a framework to create on-chain and off-chain Contract APIs, allowing Dapp developers to focus on their applications without worrying about contract logic. Some experimental features included using Marlowe parameters and treating the contract as a bundled object.

`Features included:`

- Contract as bundle objects: Annotations (experimental feature only available using TS-SDK)
- Template (experimental feature)
- Party as Addresses
- Search by Addresses
- Wallets supported (Nami, Eternl and Lace)

`Procedure:`

- **Design:** https://gist.github.com/ErickRomeroDev/1ae9aa1dc034d10a844fc879e271b653 (this gist can be uploaded directly into Playground for static analysis)
- **Create:** This contract was created using the new framework and best practices, consisting of both on-chain and off-chain APIs. Dapp developers only need to focus on business logic, as all contract execution logic is handled by the contract API. The framework includes declaring contracts as objects and using the experimental feature called annotations (SourceMap). The `code` can be found here: https://github.com/ErickRomeroDev/marlowe-web-integration/blob/main/lib/contracts-ui/fund-my-project.ts
- **Testing:** This contract was tested by simulating all possible contract paths using CLI commands. `Code` can be found here: https://github.com/ErickRomeroDev/marlowe-web-integration/blob/main/marlowe-contracts-cli/src/fund-my-project/fund-my-project-flow.ts
- **Web Integration:** We tested the integration of specific libraries into web frameworks, such as Marlowe objects and templates. Future contracts will build on this contract and its features. `Code` can be found here: https://github.com/ErickRomeroDev/marlowe-web-integration/tree/main/app/(dashboard)/(marlowe-contracts)/fund-project

```typescript
export const fundMyProjectTemplate = mkMarloweTemplate({
  name: "Fund my project",
  description: "Fund projects that are making the Cardano Community grow!!!",
  params: [
    {
      name: "payer",
      description: "Who is making the payment",
      type: "address",
    },
    {
      name: "payee",
      description: "Who is receiving the payment",
      type: "address",
    },
    {
      name: "amount",
      description: "The amount of lovelaces to be paid",
      type: "value",
    },
    {
      name: "depositDeadline",
      description: "The deadline for the payment to be made. If the payment is not made by this date, the contract can be closed",
      type: "date",
    },
    {
      name: "projectName",
      description: "The name of the project",
      type: "string",
    },
    {
      name: "githubUrl",
      description: "The link of the project GITHUB repository",
      type: "string",
    },
  ] as const,
});

export function mkFundMyProject(scheme: FundMyProjectParameters): ContractBundleMap<FundMyProjectAnnotations> {
  return {
    main: "initial-deposit",
    objects: {
      "initial-deposit": {
        type: "contract",
        value: {
          annotation: "initialDeposit",
          when: [
            {
              case: {
                party: { address: scheme.payer },
                deposits: BigInt(scheme.amount),
                of_token: lovelace,
                into_account: { address: scheme.payee },
              },
              then: close("PaymentReleasedClose"),
            },
          ],
          timeout: datetoTimeout(scheme.depositDeadline),
          timeout_continuation: close("PaymentMissedClose"),
        },
      },
    },
  };
}
```

### GIFT-CARD

`Description:`

- A user can create and send a GIFT-CARD TOKEN to a beneficiary. This token can be used to retrieve a value locked in a contract (PAYOUT). The contract includes addresses, roles, amounts, and holding times within its datum. The beneficiary's name is sent through the transaction metadata.
- The beneficiary will be able to look for all available payments for his/her wallet. The GIFT-CARD Token is a native asset so this token is transferable using a wallet without the need of a smart contract.-  
- Purpose: We continue testing and improving the initialization of a framework to create on-chain and off-chain Contract APIs, allowing Dapp developers to focus on their applications without worrying about contract logic. Some experimental features included using Marlowe parameters and treating the contract as a bundled object.

`Features included:`

- Contract as bundle objects: Annotations (experimental feature only available using TS-SDK)
- Template (experimental feature)
- Party as Addresses
- Search by Addresses
- Party as roles
- Available and withdrawn Payouts
- Wallets supported (Nami, Eternl and Lace)

`Procedure:`

- **Design:** (https://github.com/ErickRomeroDev/marlowe-web-integration/blob/main/marlowe-contracts-cli/src/gift-card/giftCard.jpg)
- **Create:** This contract was created using the new framework and best practices, consisting of both on-chain and off-chain APIs. Dapp developers only need to focus on business logic, as all contract execution logic is handled by the contract API. The framework includes declaring contracts as objects and using the experimental feature called annotations (SourceMap). The `code` can be found here: https://github.com/ErickRomeroDev/marlowe-web-integration/blob/main/marlowe-contracts-cli/src/gift-card/giftCard.ts
- **Testing:** This contract was tested by simulating all possible contract paths using CLI commands. `Code` can be found here: https://github.com/ErickRomeroDev/marlowe-web-integration/blob/main/marlowe-contracts-cli/src/gift-card/giftCard-flow.ts
- **Web Integration:** We tested the integration of specific libraries into web frameworks, such as Marlowe objects and templates. Future contracts will build on this contract and its features. `Code` can be found here: https://github.com/ErickRomeroDev/marlowe-web-integration/tree/main/app/(dashboard)/(marlowe-contracts)/giftCard

```typescript
const projectTemplate = mkMarloweTemplate({
  name: "Fund my project",
  description: "Fund projects that are making the Cardano Community grow!!!",
  params: [
    {
      name: "payer",
      description: "Who is making the payment",
      type: "address",
    },
    {
      name: "payee",
      description: "Who is receiving the payment",
      type: "address",
    },
    {
      name: "amount",
      description: "The amount of lovelaces to be paid",
      type: "value",
    },
    {
      name: "depositDeadline",
      description: "The deadline for the payment to be made. If the payment is not made by this date, the contract can be closed",
      type: "date",
    },
    {
      name: "beneficiaryName",
      description: "The name of the beneficiary",
      type: "string",
    },
  ] as const,
});

function mkBundle(scheme: ProjectParameters): ContractBundleMap<ProjectAnnotations> {
  return {
    main: "initial-deposit",
    objects: {
      "initial-deposit": {
        type: "contract",
        value: {
          annotation: "initialDeposit",
          when: [
            {
              case: {
                party: { address: scheme.payer },
                deposits: BigInt(scheme.amount),
                of_token: lovelace,
                into_account: { role_token: "payee" },
              },
              then: close("PaymentReleasedClose"),
            },
          ],
          timeout: datetoTimeout(scheme.depositDeadline),
          timeout_continuation: close("PaymentMissedClose"),
        },
      },
    },
  };
}
```


# Marlowe Next Integration

Plug-and-play programable smart contracts controlled by React Components using NEXT web-framework.

## About dApps

[Marlowe](https://marlowe.iohk.io/) home page lists all available tools developed by **IOG**[^1]:

- Playground
- Runner
- Runtime
- MarloweScan
- Typescript SDK.

Some APIs of the `TS-SDK`:

- applicableActions
- newContractAPI
- wallet
- payouts
- ContractInstanceAPI
- NewApplicableActionsAPI
- restAPI
- sourceMap

```typescript
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
```

## Smart Contracts being developed and Features:

| Name            | Description     |Interface     |Features                                            |
| --------------- | --------------- |--------------|----------------------------------------------------|
| Deposit         | simple deposit  | Web          | Contract creation and deposit action               |
| Buy me a Coffee | ask for sponsor | Web & CLI    | Basic State visualization & contract loading       |
| Fund my project | VC sponsor      | Web & CLI    | Contract Loading & Contract creation API & STATE API & CONTROL API & METADATA & SCHEME & TAGS  |

- Web3 Wallets supported (Nami, Eternl and Lace)

[^1]: IOG is a blockchain company that was one of the founder entities that build Cardano.

TODO

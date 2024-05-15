# Marlowe Next Integration

Plug-and-play programable smart contracts controlled by React Components using NEXT web-framework.

## About dApps

[Marlowe](https://marlowe.iohk.io/) home page lists all available tools developed by **IOG**[^1]:
- Playground
- Runner
- Runtime
- MarloweScan
- Typescript SDK.

Some code of the `TS-SDK`: 

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

Smart Contracts being developed: 

| Name                 | Description    |
| -------------------- | ---------------|
| Deposit              | simple deposit |
| Buy me a Coffee      | ask for sponsor|

## Features
- Web3 Wallet (Nami, Eternl and Lace)

[^1]: IOG is a blockchain company that was one of the founder entities that build Cardano.

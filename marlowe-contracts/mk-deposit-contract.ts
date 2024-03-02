import {
  Contract,
  lovelace,
  Party,
  datetoTimeout,
} from "@marlowe.io/language-core-v1";

export const DEPOSIT_TAG = {
  "buy-me-a-coffee-sponsor": {
    size: "medium",
    flavour: "chocolate",
  },
};
// Contract template save as Gist (Deposit Test)
export const mkDepositContract = (
  amtLovelace: number,
  alice: Party,
  bob: Party
) => {
  const bintAmount = BigInt(amtLovelace);
  const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
  const inTwentyFourHours = datetoTimeout(
    new Date(Date.now() + twentyFourHoursInMilliseconds)
  );

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



import { lovelace, datetoTimeout, } from "@marlowe.io/language-core-v1";
export const deposit_tag = {
    "buy-me-a-coffee-sponsor": {
        size: "medium",
        flavour: "chocolate",
    },
};
export const mkDepositContract = (amtLovelace, alice, bob) => {
    const bintAmount = BigInt(amtLovelace);
    const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
    const inTwentyFourHours = datetoTimeout(new Date(Date.now() + twentyFourHoursInMilliseconds));
    const demoContract = {
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
//# sourceMappingURL=mk-deposit-contract.js.map
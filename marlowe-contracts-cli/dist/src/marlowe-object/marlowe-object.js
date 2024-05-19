// region Delay Payment Contract
import { mkMarloweTemplate } from "@marlowe.io/marlowe-template";
import { lovelace, close } from "@marlowe.io/marlowe-object";
import { datetoTimeout } from "@marlowe.io/language-core-v1";
export const delayPaymentTemplate = mkMarloweTemplate({
    name: "Delayed payment",
    description: "In a delay payment, a `payer` transfer an `amount` of ADA to the `payee` which can be redeemed after a `releaseDeadline`. While the payment is held by the contract, it can be staked to the payer, to generate pasive income while the payee has the guarantees that the money will be released.",
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
            name: "releaseDeadline",
            description: "A date after the payment can be released to the receiver. NOTE: An empty transaction must be done to close the contract",
            type: "date",
        },
    ],
});
export function mkDelayPayment(scheme) {
    return {
        main: "initial-deposit",
        objects: {
            "release-funds": {
                type: "contract",
                value: {
                    annotation: "WaitForRelease",
                    when: [],
                    timeout: datetoTimeout(scheme.releaseDeadline),
                    timeout_continuation: close("PaymentReleasedClose"),
                },
            },
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
                            then: {
                                ref: "release-funds",
                            },
                        },
                    ],
                    timeout: datetoTimeout(scheme.depositDeadline),
                    timeout_continuation: close("PaymentMissedClose"),
                },
            },
        },
    };
}
//# sourceMappingURL=marlowe-object.js.map
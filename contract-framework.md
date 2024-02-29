![Alt text](/public/marlowe-contracts/image.png)

--Contract
{
    when: [providerCancelCase],
    timeout: vestingDate,
    timeout_continuation: {
      pay: vestingAmountPerPeriod,
      token: expectedInitialDeposit.token,
      from_account: provider,
      to: {
        account: claimer,
      },
      then: {
        when:
          periodIndex === numberOfPeriods
            ? [claimerWithdrawCase]
            : [claimerWithdrawCase, providerCancelCase],
        timeout: nextVestingDate,
        timeout_continuation: continuation,
      },
    },
  };


  ![Alt text](/public/marlowe-contracts/image.png)

  --case
  {
    case: {
      choose_between: [
        {
          from: 1n,
          to: 1n,
        },
      ],
      for_choice: {
        choice_name: "cancel",
        choice_owner: provider,
      },
    },
    then: close,
  };

  --case
{
    case: {
      choose_between: [
        {
          from: 1n,
          to: periodIndex * vestingAmountPerPeriod,
        },
      ],
      for_choice: {
        choice_name: "withdraw",
        choice_owner: claimer,
      },
    },
    then: {
      pay: {
        value_of_choice: {
          choice_name: "withdraw",
          choice_owner: claimer,
        },
      },
      token: expectedInitialDeposit.token,
      from_account: claimer,
      to: {
        party: claimer,
      },
      then: continuation,
    },
  };

  ![alt text](/public/marlowe-contracts/structure.png)

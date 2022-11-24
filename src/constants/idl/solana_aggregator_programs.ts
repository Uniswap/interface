export type SolanaAggregatorPrograms = {
  version: '0.1.0'
  name: 'solana_aggregator_programs'
  docs: [
    "Work flow: we'll init the tx, record the amount with amount in",
    'subsequence swap will use the output from state.last_amount_out',
  ]
  instructions: [
    {
      name: 'recordAmount'
      accounts: [
        {
          name: 'state'
          isMut: true
          isSigner: true
        },
        {
          name: 'signer'
          isMut: true
          isSigner: true
        },
        {
          name: 'tokenOut'
          isMut: false
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        },
      ]
      args: []
    },
    {
      name: 'checkDelta'
      accounts: [
        {
          name: 'user'
          isMut: false
          isSigner: false
        },
        {
          name: 'state'
          isMut: true
          isSigner: false
        },
        {
          name: 'tokenOut'
          isMut: false
          isSigner: false
        },
      ]
      args: [
        {
          name: 'minDelta'
          type: 'u64'
        },
      ]
    },
    {
      name: 'wrappedCall'
      docs: [
        'amount_in: the amount of token_in to swap for token_out',
        'if amount_in == 0: read the true_amount_in from our RecordAmount state',
        'otherwise: true_amount_in = amount_in',
        'amount_in_offset: the index of the beginning of serialized amount in',
        'data: the serialized instruction data',
      ]
      accounts: [
        {
          name: 'state'
          isMut: true
          isSigner: false
        },
        {
          name: 'program'
          isMut: false
          isSigner: false
        },
        {
          name: 'tokenOutAccount'
          isMut: false
          isSigner: false
        },
      ]
      args: [
        {
          name: 'amountIn'
          type: 'u64'
        },
        {
          name: 'amountInOffset'
          type: 'u8'
        },
        {
          name: 'data'
          type: 'bytes'
        },
      ]
    },
  ]
  accounts: [
    {
      name: 'recordedAmount'
      docs: [
        'RecordAmount store our on-chain state and is used for 2 purpose:',
        '- slippage rate check: by checking delta between the original amount of token out with the rsult',
        '- store last_amount_out as input for the next swaap',
      ]
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'finalTokenOut'
            type: 'publicKey'
          },
          {
            name: 'lastAmountOut'
            type: 'u64'
          },
          {
            name: 'originalAmount'
            type: 'u64'
          },
        ]
      }
    },
  ]
  errors: [
    {
      code: 6000
      name: 'PubkeyMismatched'
      msg: 'the provided TokenAccount pubkey is not matched with the recorded pubkey'
    },
    {
      code: 6001
      name: 'DeltaAmountBelowMinimum'
      msg: 'delta amount is below minimum delta'
    },
    {
      code: 6002
      name: 'SubtractionOverflow'
      msg: 'subtraction overflow'
    },
    {
      code: 6003
      name: 'SaberProgramIDMismatched'
      msg: 'saber program ID mismatched'
    },
  ]
}

export const IDL: SolanaAggregatorPrograms = {
  version: '0.1.0',
  name: 'solana_aggregator_programs',
  docs: [
    "Work flow: we'll init the tx, record the amount with amount in",
    'subsequence swap will use the output from state.last_amount_out',
  ],
  instructions: [
    {
      name: 'recordAmount',
      accounts: [
        {
          name: 'state',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'signer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'tokenOut',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'checkDelta',
      accounts: [
        {
          name: 'user',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'state',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenOut',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'minDelta',
          type: 'u64',
        },
      ],
    },
    {
      name: 'wrappedCall',
      docs: [
        'amount_in: the amount of token_in to swap for token_out',
        'if amount_in == 0: read the true_amount_in from our RecordAmount state',
        'otherwise: true_amount_in = amount_in',
        'amount_in_offset: the index of the beginning of serialized amount in',
        'data: the serialized instruction data',
      ],
      accounts: [
        {
          name: 'state',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenOutAccount',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amountIn',
          type: 'u64',
        },
        {
          name: 'amountInOffset',
          type: 'u8',
        },
        {
          name: 'data',
          type: 'bytes',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'recordedAmount',
      docs: [
        'RecordAmount store our on-chain state and is used for 2 purpose:',
        '- slippage rate check: by checking delta between the original amount of token out with the rsult',
        '- store last_amount_out as input for the next swaap',
      ],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'finalTokenOut',
            type: 'publicKey',
          },
          {
            name: 'lastAmountOut',
            type: 'u64',
          },
          {
            name: 'originalAmount',
            type: 'u64',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'PubkeyMismatched',
      msg: 'the provided TokenAccount pubkey is not matched with the recorded pubkey',
    },
    {
      code: 6001,
      name: 'DeltaAmountBelowMinimum',
      msg: 'delta amount is below minimum delta',
    },
    {
      code: 6002,
      name: 'SubtractionOverflow',
      msg: 'subtraction overflow',
    },
    {
      code: 6003,
      name: 'SaberProgramIDMismatched',
      msg: 'saber program ID mismatched',
    },
  ],
}

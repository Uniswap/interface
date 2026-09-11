/**
 * ABI fragments for the bidder-side credential check. Both are stock
 * interfaces — Uniswap's BaseERC1155ValidationHook getters and the standard
 * ERC-1155 balance read — so gating bids needs nothing vendor-specific.
 */

export const erc1155ValidationHookAbi = [
  {
    type: 'function',
    name: 'erc1155',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const

export const erc1155BalanceOfAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

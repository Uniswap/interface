import { encodeFunctionData, getAddress } from 'viem'

/**
 * When enabled, bids are encoded locally against the CCA auction contract
 * instead of asking Uniswap's liquidity backend for calldata. Third-party
 * deployments of this interface cannot reach that backend (no CORS), and CCA
 * bidding is documented as a permissionless direct contract call.
 */
export const ZKPASSPORT_ONCHAIN_BIDS = process.env.ZKPASSPORT_ONCHAIN_BIDS === 'true'

const ccaSubmitBidAbi = [
  {
    type: 'function',
    name: 'submitBid',
    stateMutability: 'payable',
    inputs: [
      { name: 'maxPrice', type: 'uint256' },
      { name: 'amount', type: 'uint128' },
      { name: 'owner', type: 'address' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [],
  },
] as const

/**
 * Builds submitBid calldata for a CCA auction. hookData stays empty: the
 * ZKPassport validation hook gates on the owner's registry balance and reads
 * nothing from it.
 */
export function encodeSubmitBidCalldata({
  maxPriceQ96,
  amountRaw,
  owner,
}: {
  maxPriceQ96: bigint
  amountRaw: bigint
  owner: string
}): `0x${string}` {
  return encodeFunctionData({
    abi: ccaSubmitBidAbi,
    functionName: 'submitBid',
    args: [maxPriceQ96, amountRaw, getAddress(owner), '0x'],
  })
}

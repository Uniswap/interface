import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { CreateSwapRequest, CreateSwapResponse, RequestId, TradeType } from 'uniswap/src/data/tradingApi/__generated__'

import { client } from '../client'

// SwapRouter ABI
const SWAP_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    name: 'exactOutputSingle',
    type: 'function',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'amountInMaximum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountIn', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    name: 'multicall',
    type: 'function',
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [{ name: 'results', type: 'bytes[]' }],
    stateMutability: 'payable',
  },
] as const

// Permit2 ABI for signature-based approvals
const PERMIT2_ABI = [
  {
    name: 'permitTransferFrom',
    type: 'function',
    inputs: [
      {
        name: 'permit',
        type: 'tuple',
        components: [
          {
            name: 'permitted',
            type: 'tuple',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      {
        name: 'transferDetails',
        type: 'tuple',
        components: [
          { name: 'to', type: 'address' },
          { name: 'requestedAmount', type: 'uint256' },
        ],
      },
      { name: 'owner', type: 'address' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

export const swap = async (params: CreateSwapRequest): Promise<CreateSwapResponse> => {
  if (!params.quote) {
    throw new Error('Quote is required for swap')
  }

  // Extract quote details - assuming ClassicQuote for V3 swaps
  const quote = params.quote as any
  const swapRouterAddress = CHAIN_TO_ADDRESSES_MAP[10000]?.swapRouter02Address as `0x${string}`

  // Set deadline - use provided deadline or default to 30 minutes from now
  const deadline =
    params.deadline && params.deadline > Math.floor(Date.now() / 1000)
      ? BigInt(params.deadline)
      : BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 minutes

  // Get current gas price
  const baseGasPrice = await client.getGasPrice()
  const gasPrice = baseGasPrice

  let swapCalldata: string
  let value = '0'

  // Get token addresses and amounts from the quote
  const tokenIn = quote.route[0][0].tokenIn.address
  const tokenOut = quote.route[0][0].tokenOut.address
  const fee = parseInt(quote.route[0][0].fee)
  const isExactInput = quote.tradeType === TradeType.EXACT_INPUT

  // Extract recipient from the existing calldata or use a default
  // In practice, this should be extracted from the quote's methodParameters
  const recipient = '0x0000000000000000000000000000000000000000' // This should be the actual recipient

  // Standard swap (requires prior token approval)
  swapCalldata = quote.methodParameters.calldata

  // Handle native ETH swaps
  if (
    tokenIn === '0x0000000000000000000000000000000000000000' ||
    tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  ) {
    value = isExactInput ? quote.amount : quote.quote
  }

  // Generate request ID (in practice, this might come from a backend service)
  const requestId: RequestId = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    requestId,
    swap: await client.prepareTransactionRequest({
      from: params.quote.swapper,
      to: swapRouterAddress,
      data: swapCalldata,
      gas: 10000000,
      value,
    }),
  }
}

import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { CreateSwapRequest, CreateSwapResponse, RequestId } from 'uniswap/src/data/tradingApi/__generated__'

import { client } from '../client'

export const swap = async (params: CreateSwapRequest): Promise<CreateSwapResponse> => {
  console.log('swap', params)
  if (!params.quote) {
    throw new Error('Quote is required for swap')
  }

  // Extract quote details - assuming ClassicQuote for V3 swaps
  const quote = params.quote as any
  const swapRouterAddress = CHAIN_TO_ADDRESSES_MAP[10000]?.swapRouter02Address as `0x${string}`

  // Generate request ID (in practice, this might come from a backend service)
  const requestId: RequestId = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return {
    requestId,
    swap: await client.prepareTransactionRequest({
      from: params.quote.swapper,
      to: swapRouterAddress,
      data: quote.methodParameters.calldata,
      gas: 500000,
      value: quote.methodParameters.value,
    }),
    gasFee: '1',
  }
}

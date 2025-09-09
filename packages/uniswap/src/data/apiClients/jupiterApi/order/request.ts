import { uniswapUrls } from 'uniswap/src/constants/urls'
import { JupiterApiClient } from 'uniswap/src/data/apiClients/jupiterApi/JupiterApiClient'
import {
  JupiterOrderResponse,
  jupiterOrderResponseSchema,
  JupiterOrderUrlParams,
} from 'uniswap/src/data/apiClients/jupiterApi/order/types'

export async function fetchOrder(params: JupiterOrderUrlParams): Promise<JupiterOrderResponse> {
  const query = new URLSearchParams()

  query.set('inputMint', params.inputMint)

  query.set('outputMint', params.outputMint)

  query.set('amount', params.amount.toString())

  query.set('swapMode', params.swapMode)

  if (params.taker) {
    query.set('taker', params.taker)
  }
  if (params.referralAccount) {
    query.set('referralAccount', params.referralAccount)
  }
  if (params.referralFee) {
    query.set('referralFee', params.referralFee.toString())
  }
  if (params.slippageBps) {
    query.set('slippageBps', params.slippageBps.toString())
  }

  const result = await JupiterApiClient.get(uniswapUrls.jupiterApiPaths.order + '?' + query.toString())

  return jupiterOrderResponseSchema.parse(result)
}

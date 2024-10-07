import { TransactionRequest } from '@ethersproject/providers'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { GasFeeResponse } from 'uniswap/src/features/gas/types'
import { isInterface } from 'utilities/src/platform'

export const UNISWAP_API_CACHE_KEY = 'UniswapApi'

const UniswapApiClient = createApiClient({
  baseUrl: uniswapUrls.apiBaseUrl,
  additionalHeaders: {
    'x-api-key': config.uniswapApiKey,
  },
  includeBaseUniswapHeaders: !isInterface,
})

export async function fetchGasFee(params: TransactionRequest): Promise<GasFeeResponse> {
  return await UniswapApiClient.post<GasFeeResponse>(uniswapUrls.gasServicePath, {
    body: JSON.stringify(params),
  })
}

export type ScreenResponse = {
  block: boolean
}

export type ScreenRequest = {
  address: string
}

export async function fetchTrmScreen(params: ScreenRequest): Promise<ScreenResponse> {
  return await UniswapApiClient.post<ScreenResponse>(uniswapUrls.trmPath, {
    body: JSON.stringify(params),
  })
}

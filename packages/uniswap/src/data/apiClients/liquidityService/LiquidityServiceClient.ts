import { createLiquidityServiceClient } from '@universe/api'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createUniswapFetchClient } from 'uniswap/src/data/apiClients/createUniswapFetchClient'

const LiquidityServiceFetchClient = createUniswapFetchClient({
  baseUrl: uniswapUrls.liquidityServiceUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

export const LiquidityServiceClient = createLiquidityServiceClient({
  fetchClient: LiquidityServiceFetchClient,
})

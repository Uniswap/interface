import { createJupiterApiClient, JupiterApiClient as JupiterApiClientType } from '@universe/api'
import { config } from 'uniswap/src/config'
import { createUniswapFetchClient } from 'uniswap/src/data/apiClients/createUniswapFetchClient'

const JupiterFetchClient = createUniswapFetchClient({
  baseUrl: `${config.jupiterProxyUrl}/ultra/v1`,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

export const JupiterApiClient: JupiterApiClientType = createJupiterApiClient({
  fetchClient: JupiterFetchClient,
})

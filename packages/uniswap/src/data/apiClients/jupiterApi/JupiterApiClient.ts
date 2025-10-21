import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'

export const JupiterApiClient = createApiClient({
  baseUrl: uniswapUrls.jupiterApiUrl,
})

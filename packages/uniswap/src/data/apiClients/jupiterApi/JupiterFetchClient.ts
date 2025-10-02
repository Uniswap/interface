import { createJupiterApiClient, JupiterApiClient as JupiterApiClientType } from '@universe/api'
import { createUniswapFetchClient } from 'uniswap/src/data/apiClients/createUniswapFetchClient'

const JUPITER_API_URL = 'https://infra-auth-proxy.backend-dev.api.uniswap.org/jupiter/ultra/v1'

const JupiterFetchClient = createUniswapFetchClient({
  baseUrl: JUPITER_API_URL,
})

export const JupiterApiClient: JupiterApiClientType = createJupiterApiClient({
  fetchClient: JupiterFetchClient,
})

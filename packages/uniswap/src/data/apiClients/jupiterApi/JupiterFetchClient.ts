import { createJupiterApiClient, JupiterApiClient as JupiterApiClientType } from '@universe/api'
import { createUniswapFetchClient } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import { isDevEnv } from 'utilities/src/environment/env'

// As access to the Jupiter api will move to the trading API & the interim proxy endpoint are
// platform-agnostic, we do not need to put the proxy urls behind env vars.
const JUPITER_PROD_PROXY_URL = 'https://entry-gateway.backend-prod.api.uniswap.org/jupiter'
const JUPITER_DEV_PROXY_URL = 'https://infra-auth-proxy.backend-dev.api.uniswap.org/jupiter'
const JUPITER_PROXY_API_URL = isDevEnv() ? JUPITER_DEV_PROXY_URL : JUPITER_PROD_PROXY_URL

const JupiterFetchClient = createUniswapFetchClient({
  baseUrl: `${JUPITER_PROXY_API_URL}/ultra/v1`,
})

export const JupiterApiClient: JupiterApiClientType = createJupiterApiClient({
  fetchClient: JupiterFetchClient,
})

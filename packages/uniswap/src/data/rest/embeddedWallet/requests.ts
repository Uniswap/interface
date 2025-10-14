import { createPromiseClient } from '@connectrpc/connect'
import { EmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'

import { createConnectTransportWithDefaults, createEmbeddedWalletApiClient } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/constants'
import { isBetaEnv, isProdEnv } from 'utilities/src/environment/env'
import { isExtensionApp, isMobileApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

const isWalletBeta = (isExtensionApp || isMobileApp) && isBetaEnv()

const EmbeddedWalletTransport = createConnectTransportWithDefaults(
  {
    baseUrl: isProdEnv() || isWalletBeta ? uniswapUrls.evervaultProductionUrl : uniswapUrls.evervaultStagingUrl,
    additionalHeaders: {
      ...(isMobileApp && { Origin: uniswapUrls.requestOriginUrl }),
      'x-request-source': REQUEST_SOURCE,
      'x-app-version': getVersionHeader(),
    },
  },
  {
    credentials: 'include',
  },
)
const EmbeddedWalletRpcClient = createPromiseClient(EmbeddedWalletService, EmbeddedWalletTransport)

export const EmbeddedWalletApiClient = createEmbeddedWalletApiClient({ rpcClient: EmbeddedWalletRpcClient })

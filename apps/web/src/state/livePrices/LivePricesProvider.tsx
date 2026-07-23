import { getEntryGatewayUrl, getWebSocketUrl, SharedQueryClient } from '@universe/api'
import { isDevEnv } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { TokenPriceMessage, TokenSubscriptionParams } from '@universe/prices'
import {
  createPriceKey,
  createPriceSubscriptionHandler,
  parseConnectionMessage,
  parseTokenPriceMessage,
  priceKeys,
} from '@universe/prices'
import type { WebSocketClient } from '@universe/websocket'
import { createWebSocketClient, createZustandConnectionStore } from '@universe/websocket'
import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { RemotePriceProvider } from 'uniswap/src/features/prices/RemotePriceProvider'
import { logger } from 'utilities/src/logger/logger'
import { createLivePricesFetchClient } from '~/state/livePrices/createLivePricesFetchClient'

function createLivePricesClient(): WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']> | null {
  const wsUrl = getWebSocketUrl()
  const subscriptionApiUrl = getEntryGatewayUrl()
  if (!subscriptionApiUrl) {
    if (isDevEnv()) {
      // oxlint-disable-next-line no-console -- Dev-only warning
      console.warn('[livePrices] subscriptionApiUrl not available, live prices disabled')
    }
    return null
  }

  const debug = isDevEnv()

  const connectionStore = createZustandConnectionStore({
    enableDevtools: debug,
    devtoolsName: 'livePricesConnection',
  })

  const fetchClient = createLivePricesFetchClient({ subscriptionApiUrl })

  const subscriptionHandler = createPriceSubscriptionHandler({
    client: fetchClient,
    onError: (error, operation) => {
      logger.warn('LivePrices', operation, `Error in ${operation}`, { error })
    },
  })

  return createWebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']>({
    config: { url: wsUrl, debug },
    connectionStore,
    subscriptionHandler,
    sessionRefreshIntervalMs: 60_000,
    parseMessage: parseTokenPriceMessage,
    parseConnectionMessage,
    createSubscriptionKey: (_channel, params) => createPriceKey(params.chainId, params.tokenAddress),
    onError: (error) => {
      logger.warn('LivePrices', 'WebSocket', 'WebSocket error', { error })
    },
    onRawMessage: (message) => {
      const parsed = parseTokenPriceMessage(message)
      if (parsed) {
        const { chainId, tokenAddress, priceUsd, timestamp } = parsed.data
        SharedQueryClient.setQueryData(priceKeys.token(chainId, tokenAddress), {
          price: priceUsd,
          timestamp,
          source: 'aurora_ws',
        })
      }
    },
  })
}

export function LivePricesProvider({ children }: { children: ReactNode }): ReactElement {
  const usesAuroraLivePrices = useFeatureFlag(FeatureFlags.CentralizedPrices)

  if (!usesAuroraLivePrices) {
    return <RemotePriceProvider>{children}</RemotePriceProvider>
  }

  return <LivePricesProviderInner>{children}</LivePricesProviderInner>
}

function LivePricesProviderInner({ children }: { children: ReactNode }): ReactElement {
  const [wsClient] = useState(() => createLivePricesClient())

  return <RemotePriceProvider wsClient={wsClient ?? undefined}>{children}</RemotePriceProvider>
}

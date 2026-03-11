import {
  createFetchClient,
  getEntryGatewayUrl,
  getWebSocketUrl,
  provideSessionService,
  SharedQueryClient,
} from '@universe/api'
import { FeatureFlags, getIsSessionServiceEnabled, useFeatureFlag } from '@universe/gating'
import type { TokenPriceMessage, TokenSubscriptionParams } from '@universe/prices'
import {
  createPriceKey,
  createPriceSubscriptionHandler,
  PriceServiceProvider,
  parseConnectionMessage,
  parseTokenPriceMessage,
  priceKeys,
  RestPriceBatcher,
} from '@universe/prices'
import type { WebSocketClient } from '@universe/websocket'
import { createWebSocketClient, createZustandConnectionStore } from '@universe/websocket'
import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'
import { createRestPriceClient } from '~/state/livePrices/createRestPriceClient'

function createLivePricesClient(): WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']> | null {
  const wsUrl = getWebSocketUrl()
  const subscriptionApiUrl = getEntryGatewayUrl()
  if (!subscriptionApiUrl) {
    if (isDevEnv()) {
      // biome-ignore lint/suspicious/noConsole: Dev-only warning
      console.warn('[livePrices] subscriptionApiUrl not available, live prices disabled')
    }
    return null
  }

  const debug = isDevEnv()

  const connectionStore = createZustandConnectionStore({
    enableDevtools: debug,
    devtoolsName: 'livePricesConnection',
  })

  const fetchClient = createFetchClient({
    baseUrl: subscriptionApiUrl,
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'x-request-source': REQUEST_SOURCE,
    }),
    getSessionService: () =>
      provideSessionService({ getBaseUrl: () => getEntryGatewayUrl(), getIsSessionServiceEnabled }),
    defaultOptions: { credentials: 'include' },
  })

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
        })
      }
    },
  })
}

const restBatcher = new RestPriceBatcher(createRestPriceClient())

export function LivePricesProvider({ children }: { children: ReactNode }): ReactElement {
  const useCentralized = useFeatureFlag(FeatureFlags.CentralizedPrices)

  if (!useCentralized) {
    return <>{children}</>
  }

  return <LivePricesProviderInner>{children}</LivePricesProviderInner>
}

function LivePricesProviderInner({ children }: { children: ReactNode }): ReactElement {
  const [wsClient] = useState(createLivePricesClient)

  if (!wsClient) {
    return <>{children}</>
  }

  return (
    <PriceServiceProvider wsClient={wsClient} queryClient={SharedQueryClient} restBatcher={restBatcher}>
      {children}
    </PriceServiceProvider>
  )
}

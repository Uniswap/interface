import { getEntryGatewayUrl, getWebSocketUrl, SharedQueryClient } from '@universe/api'
import { isDevEnv } from '@universe/environment'
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

  const subscriptionHandler = createPriceSubscriptionHandler({ client: fetchClient })

  return createWebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']>({
    config: { url: wsUrl, debug },
    connectionStore,
    subscriptionHandler,
    sessionRefreshIntervalMs: 60_000,
    parseMessage: parseTokenPriceMessage,
    parseConnectionMessage,
    createSubscriptionKey: (_channel, params) => createPriceKey(params.chainId, params.tokenAddress),
    onError: (error, operation) => {
      if (operation) {
        logger.warn('LivePrices', operation, `Error in ${operation}`, { error })
      } else {
        logger.warn('LivePrices', 'WebSocket', 'WebSocket error', { error })
      }
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

/** Provides remote price fetching backed by the Aurora live-price websocket. */
export function LivePricesProvider({ children }: { children: ReactNode }): ReactElement {
  // Created once and kept for the session; `null` means no live-price transport is available.
  const [wsClient] = useState(createLivePricesClient)

  return <RemotePriceProvider wsClient={wsClient ?? undefined}>{children}</RemotePriceProvider>
}

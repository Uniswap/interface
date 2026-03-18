import type { QueryClient } from '@tanstack/react-query'
import type { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { TokenPriceMessage, TokenSubscriptionParams } from '@universe/prices/src/types'
import type { WebSocketClient } from '@universe/websocket'
import { createContext, type ReactElement, type ReactNode, useContext, useMemo } from 'react'

interface PricesContextValue {
  wsClient: WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']>
  queryClient: QueryClient
  restBatcher?: RestPriceBatcher
}

const PricesContext = createContext<PricesContextValue | null>(null)

export function PriceServiceProvider({
  wsClient,
  queryClient,
  restBatcher,
  children,
}: {
  wsClient: WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']>
  queryClient: QueryClient
  restBatcher?: RestPriceBatcher
  children: ReactNode
}): ReactElement {
  const value = useMemo(() => ({ wsClient, queryClient, restBatcher }), [wsClient, queryClient, restBatcher])
  return <PricesContext.Provider value={value}>{children}</PricesContext.Provider>
}

export function usePricesContext(): PricesContextValue {
  const context = useContext(PricesContext)
  if (!context) {
    throw new Error('usePricesContext must be used within a PriceServiceProvider')
  }
  return context
}

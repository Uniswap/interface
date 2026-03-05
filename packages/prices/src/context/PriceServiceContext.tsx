import type { QueryClient } from '@tanstack/react-query'
import type { TokenPriceMessage, TokenSubscriptionParams } from '@universe/prices/src/types'
import type { WebSocketClient } from '@universe/websocket'
import { createContext, type ReactElement, type ReactNode, useContext } from 'react'

interface PricesContextValue {
  wsClient: WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']>
  queryClient: QueryClient
}

const PricesContext = createContext<PricesContextValue | null>(null)

export function PriceServiceProvider({
  wsClient,
  queryClient,
  children,
}: {
  wsClient: WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']>
  queryClient: QueryClient
  children: ReactNode
}): ReactElement {
  return <PricesContext.Provider value={{ wsClient, queryClient }}>{children}</PricesContext.Provider>
}

export function usePricesContext(): PricesContextValue {
  const context = useContext(PricesContext)
  if (!context) {
    throw new Error('usePricesContext must be used within a PriceServiceProvider')
  }
  return context
}

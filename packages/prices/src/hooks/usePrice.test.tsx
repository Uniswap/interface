// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { PriceServiceProvider } from '@universe/prices/src/context/PriceServiceContext'
import { usePrice } from '@universe/prices/src/hooks/usePrice'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import type { TokenPriceData, TokenPriceMessage, TokenSubscriptionParams } from '@universe/prices/src/types'
import type { WebSocketClient } from '@universe/websocket'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const CHAIN_ID = 1
const ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

function createMockWsClient(): WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']> {
  return {
    isConnected: vi.fn(() => false),
    getConnectionStatus: vi.fn(() => 'disconnected' as const),
    getConnectionId: vi.fn(() => null),
    subscribe: vi.fn(() => vi.fn()),
    onStatusChange: vi.fn(() => vi.fn()),
    onConnectionEstablished: vi.fn(() => vi.fn()),
  }
}

function renderUsePrice(options: { chainId: number | undefined; address: string | undefined }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <QueryClientProvider client={queryClient}>
      <PriceServiceProvider wsClient={createMockWsClient()} queryClient={queryClient}>
        {children}
      </PriceServiceProvider>
    </QueryClientProvider>
  )
  const { result } = renderHook(() => usePrice(options), { wrapper })
  return { result, queryClient }
}

describe('usePrice', () => {
  it('reports isLoading while no price has arrived yet', () => {
    const { result } = renderUsePrice({ chainId: CHAIN_ID, address: ADDRESS })

    expect(result.current.price).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('clears isLoading once a price lands in the cache', async () => {
    const { result, queryClient } = renderUsePrice({ chainId: CHAIN_ID, address: ADDRESS })

    const data: TokenPriceData = { price: 2500, timestamp: Date.now(), source: 'aurora_ws' }
    queryClient.setQueryData(priceKeys.token(CHAIN_ID, ADDRESS), data)

    await waitFor(() => {
      expect(result.current.price).toBe(2500)
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('is not loading when disabled (missing chainId/address)', () => {
    const { result } = renderUsePrice({ chainId: undefined, address: undefined })

    expect(result.current.price).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })
})

// @vitest-environment jsdom

import type { QueryClient } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { PriceServiceProvider, usePricesContext } from '@universe/prices/src/context/PriceServiceContext'
import type { TokenPriceMessage, TokenSubscriptionParams } from '@universe/prices/src/types'
import type { WebSocketClient } from '@universe/websocket'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

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

function createMockQueryClient(): QueryClient {
  return { setQueryData: vi.fn() } as unknown as QueryClient
}

describe('PriceServiceContext', () => {
  it('usePricesContext throws when used outside PriceServiceProvider', () => {
    expect(() => {
      renderHook(() => usePricesContext())
    }).toThrow('usePricesContext must be used within a PriceServiceProvider')
  })

  it('usePricesContext returns wsClient and queryClient when inside PriceServiceProvider', () => {
    const mockWsClient = createMockWsClient()
    const mockQueryClient = createMockQueryClient()

    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <PriceServiceProvider wsClient={mockWsClient} queryClient={mockQueryClient}>
        {children}
      </PriceServiceProvider>
    )

    const { result } = renderHook(() => usePricesContext(), { wrapper })

    expect(result.current.wsClient).toBe(mockWsClient)
    expect(result.current.queryClient).toBe(mockQueryClient)
  })

  it('PriceServiceProvider renders children', () => {
    const mockWsClient = createMockWsClient()
    const mockQueryClient = createMockQueryClient()

    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <PriceServiceProvider wsClient={mockWsClient} queryClient={mockQueryClient}>
        {children}
      </PriceServiceProvider>
    )

    const { result } = renderHook(() => 'rendered', { wrapper })

    expect(result.current).toBe('rendered')
  })
})

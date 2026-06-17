import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { useCreateAuctionMutation } from 'uniswap/src/data/rest/auctions/useCreateAuctionMutation'
import { describe, expect, it, vi } from 'vitest'

const mockCreateAuction = vi.fn()
vi.mock('uniswap/src/data/apiClients/liquidityService/AuctionMutationClient', () => ({
  AuctionMutationClient: { createAuction: (...args: unknown[]) => mockCreateAuction(...args) },
}))

function wrapper({ children }: PropsWithChildren): JSX.Element {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

type CreateAuctionRequestArg = Parameters<ReturnType<typeof useCreateAuctionMutation>['mutateAsync']>[0]
const request = { chainId: 1, walletAddress: '0xWallet' } as unknown as CreateAuctionRequestArg

describe('useCreateAuctionMutation', () => {
  it('forwards the request to AuctionMutationClient.createAuction and returns the response', async () => {
    const response = { predictedTokenAddress: '0xToken', requestId: 'req-1' }
    mockCreateAuction.mockResolvedValue(response)

    const { result } = renderHook(() => useCreateAuctionMutation(), { wrapper })
    let returned: unknown
    await act(async () => {
      returned = await result.current.mutateAsync(request)
    })

    expect(mockCreateAuction).toHaveBeenCalledWith(expect.objectContaining({ chainId: 1, walletAddress: '0xWallet' }))
    expect(returned).toBe(response)
  })

  it('rejects when the client call fails', async () => {
    mockCreateAuction.mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useCreateAuctionMutation(), { wrapper })
    await act(async () => {
      await expect(result.current.mutateAsync(request)).rejects.toThrow('boom')
    })
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { Auction, GetAuctionResponse } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTokenDetailsAuction } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'

const mockGetAuction = vi.hoisted(() => vi.fn())

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: () => true,
  useStatsigClientStatus: () => ({ isStatsigReady: true }),
}))

// Fake only the network boundary. Unlike useTokenDetailsAuction.test.ts, the real
// auctionQueries factory and real react-query stay in play, so this suite fails if the shared
// getAuction options ever adopt placeholder data (e.g. keepPreviousData) or stop keying by token.
vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient', () => ({
  AuctionServiceClient: { getAuction: mockGetAuction },
}))

// Pre-normalized (lowercase) forms of the URL params, matching what getValidAddress produces.
const TOKEN_A = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const TOKEN_B = '0x6b175474e89094c44da98b954eedeac495271d0f'

function auctionResponse(tokenAddress: string, auctionAddress: string): GetAuctionResponse {
  return new GetAuctionResponse({ auctions: [new Auction({ address: auctionAddress, tokenAddress })] })
}

describe('useTokenDetailsAuction query wiring', () => {
  it('resets to loading on a token navigation instead of surfacing the previous token’s auction', async () => {
    let resolveTokenB: (response: GetAuctionResponse) => void = () => {}
    mockGetAuction.mockImplementation((request: { address: string }) => {
      if (request.address === TOKEN_A) {
        return Promise.resolve(auctionResponse(TOKEN_A, '0x1111111111111111111111111111111111111111'))
      }
      return new Promise<GetAuctionResponse>((resolve) => {
        resolveTokenB = resolve
      })
    })

    const queryClient = new QueryClient()
    const wrapper = ({ children }: PropsWithChildren): JSX.Element => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result, rerender } = renderHook(
      ({ tokenAddress }: { tokenAddress: string }) =>
        useTokenDetailsAuction({ chainId: UniverseChainId.Mainnet, tokenAddress, isNative: false }),
      { initialProps: { tokenAddress: TOKEN_A }, wrapper },
    )

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: TokenDetailsSourceState.Found,
        auction: { tokenAddress: TOKEN_A },
      })
    })

    rerender({ tokenAddress: TOKEN_B })

    // The regression this pins: with placeholder data on the query, token B's page would report
    // token A's auction as Found here until B's fetch settles.
    expect(result.current.status).toBe(TokenDetailsSourceState.Loading)

    resolveTokenB(auctionResponse(TOKEN_B, '0x2222222222222222222222222222222222222222'))

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: TokenDetailsSourceState.Found,
        auction: { tokenAddress: TOKEN_B },
      })
    })
  })
})

import type { PartialMessage } from '@bufbuild/protobuf'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, type RenderHookResult, waitFor } from '@testing-library/react'
import { type GetTokenRequest, GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import { useAuctionTradingTokenInfo } from '~/features/Toucan/Auction/hooks/useAuctionTradingTokenInfo'

const { mockGetToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn<(request: PartialMessage<GetTokenRequest>) => Promise<GetTokenResponse>>(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getToken: mockGetToken },
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionTradingToken', () => ({
  useAuctionTradingToken: vi.fn(),
}))
vi.mock('utilities/src/logger/logger', () => ({
  logger: { warn: vi.fn() },
}))

const RECEIPT_ADDRESS = '0x9999b7e3cc6979223ff1af980b7d8b90b75d9999'
const UNDERLYING_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const mockStoreState = {
  auctionDetails: {
    chainId: UniverseChainId.Mainnet,
    tokenAddress: RECEIPT_ADDRESS,
    tokenSymbol: 'rCAP',
  },
}
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

function renderTradingTokenInfo(enabled = true): RenderHookResult<
  ReturnType<typeof useAuctionTradingTokenInfo>,
  { enabled: boolean }
> & {
  queryClient: QueryClient
} {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const hook = renderHook(({ enabled }) => useAuctionTradingTokenInfo({ enabled }), {
    initialProps: { enabled },
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
  return { ...hook, queryClient }
}

describe('useAuctionTradingTokenInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockReset().mockRejectedValue(new Error('request failed with private response details'))
    mockStoreState.auctionDetails.chainId = UniverseChainId.Mainnet
    vi.mocked(useAuctionTradingToken).mockReset().mockReturnValue({
      tradingTokenAddress: UNDERLYING_ADDRESS,
      loading: false,
    })
  })

  it('warns once per token while preserving the destination and generic identity fallback', async () => {
    const { result, rerender, queryClient } = renderTradingTokenInfo()

    await waitFor(() => expect(logger.warn).toHaveBeenCalledTimes(1))
    expect(logger.warn).toHaveBeenCalledWith(
      'useAuctionTradingTokenInfo',
      'useAuctionTradingTokenInfo',
      'Failed to load underlying auction trading token metadata',
      { chainId: UniverseChainId.Mainnet },
    )
    expect(result.current).toEqual({
      address: UNDERLYING_ADDRESS,
      symbol: undefined,
      logoUrl: undefined,
      loading: false,
    })

    rerender({ enabled: true })
    await act(async () => {
      await queryClient.refetchQueries()
    })
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('warns once per token as the chain or address changes', async () => {
    const { result, rerender } = renderTradingTokenInfo()
    await waitFor(() => expect(logger.warn).toHaveBeenCalledTimes(1))

    mockStoreState.auctionDetails.chainId = UniverseChainId.ArbitrumOne
    rerender({ enabled: true })
    await waitFor(() => expect(logger.warn).toHaveBeenCalledTimes(2))
    expect(logger.warn).toHaveBeenLastCalledWith(
      'useAuctionTradingTokenInfo',
      'useAuctionTradingTokenInfo',
      'Failed to load underlying auction trading token metadata',
      { chainId: UniverseChainId.ArbitrumOne },
    )

    vi.mocked(useAuctionTradingToken).mockReturnValue({
      tradingTokenAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      loading: false,
    })
    rerender({ enabled: true })
    await waitFor(() => expect(logger.warn).toHaveBeenCalledTimes(3))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetToken).toHaveBeenCalledTimes(3)
  })

  it('does not fetch or warn while disabled', () => {
    renderTradingTokenInfo(false)

    expect(mockGetToken).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('uses ordinary auction metadata without fetching or warning', () => {
    vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: RECEIPT_ADDRESS, loading: false })
    const { result } = renderTradingTokenInfo()

    expect(result.current.symbol).toBe('rCAP')
    expect(mockGetToken).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('does not warn while metadata is loading', () => {
    mockGetToken.mockReturnValue(new Promise<GetTokenResponse>(() => undefined))
    const { result } = renderTradingTokenInfo()

    expect(result.current.loading).toBe(true)
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('does not treat a successful missing-token response as a request failure', async () => {
    mockGetToken.mockResolvedValue(new GetTokenResponse())
    const { result } = renderTradingTokenInfo()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.symbol).toBeUndefined()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('keeps usable metadata without warning if a background refresh fails', async () => {
    mockGetToken.mockResolvedValueOnce(
      new GetTokenResponse({
        token: { chainId: UniverseChainId.Mainnet, address: UNDERLYING_ADDRESS, symbol: 'CAP' },
      }),
    )
    const { result, queryClient } = renderTradingTokenInfo()
    await waitFor(() => expect(result.current.symbol).toBe('CAP'))

    await act(async () => {
      await queryClient.refetchQueries()
    })

    expect(result.current.symbol).toBe('CAP')
    expect(logger.warn).not.toHaveBeenCalled()
  })
})

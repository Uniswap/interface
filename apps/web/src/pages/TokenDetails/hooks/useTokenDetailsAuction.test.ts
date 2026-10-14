import type { PlainMessage } from '@bufbuild/protobuf'
import { renderHook } from '@testing-library/react'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags } from '@universe/gating'
import { AuctionStaleTime } from 'uniswap/src/data/apiClients/dataApiService/auctions/queryTypes'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTokenDetailsAuction } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'

const mockUseFeatureFlag = vi.fn()
const mockUseStatsigClientStatus = vi.fn()
const mockUseQuery = vi.fn()
const mockGetAuction = vi.fn((options) => options)

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureFlag: (flag: unknown) => mockUseFeatureFlag(flag),
  useStatsigClientStatus: () => mockUseStatsigClientStatus(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: (options: unknown) => mockUseQuery(options),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries', () => ({
  auctionQueries: {
    getAuction: (options: unknown) => mockGetAuction(options),
  },
}))

const TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const NORMALIZED_TOKEN_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const AUCTION = {
  address: '0x1111111111111111111111111111111111111111',
  tokenAddress: NORMALIZED_TOKEN_ADDRESS,
} as PlainMessage<Auction>
const HIDDEN_AUCTION = {
  ...AUCTION,
  auctionId: '1_0xD9E8355f9f57185928347a5BdDEe164006b16e58', // Abandoned Interfold auction.
}
const SECOND_AUCTION = {
  ...AUCTION,
  address: '0x2222222222222222222222222222222222222222',
  auctionId: '1_0x2222222222222222222222222222222222222222',
} as PlainMessage<Auction>

function queryResult(
  overrides: {
    data?: { auctions: PlainMessage<Auction>[] }
    error?: Error | null
    isSuccess?: boolean
  } = {},
) {
  return {
    data: undefined,
    error: null,
    isSuccess: false,
    ...overrides,
  }
}

function renderAuction({
  chainId = UniverseChainId.Mainnet,
  tokenAddress = TOKEN_ADDRESS,
  isNative = false,
}: {
  chainId?: UniverseChainId
  tokenAddress?: string
  isNative?: boolean
} = {}) {
  return renderHook(() => useTokenDetailsAuction({ chainId, tokenAddress, isNative }))
}

describe(useTokenDetailsAuction, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFeatureFlag.mockReturnValue(true)
    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: true })
    mockUseQuery.mockReturnValue(queryResult())
  })

  it('looks up the token by normalized URL address and chain', () => {
    renderAuction()

    expect(mockUseFeatureFlag).toHaveBeenCalledWith(FeatureFlags.TokenProvenance)
    expect(mockGetAuction).toHaveBeenCalledWith({
      params: expect.objectContaining({
        chainId: UniverseChainId.Mainnet,
        address: NORMALIZED_TOKEN_ADDRESS,
      }),
      enabled: true,
      staleTime: AuctionStaleTime.SLOW,
    })
  })

  it('ignores cached data when the flag is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [AUCTION] }, error: new Error('cached error') }))

    const { result } = renderAuction()

    expect(mockGetAuction).toHaveBeenCalledWith({ params: undefined, enabled: false, staleTime: AuctionStaleTime.SLOW })
    expect(result.current.status).toBe(TokenDetailsSourceState.Disabled)
  })

  it('stays loading until Statsig confirms the flag is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: false })

    const { result, rerender } = renderAuction()

    expect(result.current.status).toBe(TokenDetailsSourceState.Loading)
    expect(mockGetAuction).toHaveBeenLastCalledWith({
      params: undefined,
      enabled: false,
      staleTime: AuctionStaleTime.SLOW,
    })

    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: true })
    rerender()

    expect(result.current.status).toBe(TokenDetailsSourceState.Disabled)
  })

  it.each([
    ['a native token', UniverseChainId.Mainnet, TOKEN_ADDRESS, true],
    ['a non-EVM chain', UniverseChainId.Solana, TOKEN_ADDRESS, false],
    ['an invalid address', UniverseChainId.Mainnet, 'not-an-address', false],
  ])('skips %s', (_label, chainId, tokenAddress, isNative) => {
    renderAuction({ chainId, tokenAddress, isNative })

    expect(mockGetAuction).toHaveBeenCalledWith({ params: undefined, enabled: false, staleTime: AuctionStaleTime.SLOW })
  })

  it('returns a found auction even when a background refetch failed', () => {
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [AUCTION] }, error: new Error('unavailable') }))

    const { result } = renderAuction()

    expect(result.current).toMatchObject({
      status: TokenDetailsSourceState.Found,
      auction: AUCTION,
    })
  })

  it('treats a hidden auction as not found', () => {
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [HIDDEN_AUCTION] }, isSuccess: true }))

    const { result } = renderAuction()

    expect(result.current).toEqual({ status: TokenDetailsSourceState.NotFound })
  })

  it('skips hidden auctions in favour of a visible one', () => {
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [HIDDEN_AUCTION, AUCTION] }, isSuccess: true }))

    const { result } = renderAuction()

    expect(result.current).toEqual({ status: TokenDetailsSourceState.Found, auction: AUCTION, auctions: [AUCTION] })
  })

  it('exposes every visible auction and keeps the first as primary', () => {
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [AUCTION, SECOND_AUCTION] }, isSuccess: true }))

    const { result } = renderAuction()

    expect(result.current).toEqual({
      status: TokenDetailsSourceState.Found,
      auction: AUCTION,
      auctions: [AUCTION, SECOND_AUCTION],
    })
  })

  it('does not restore a cached hidden auction when a background refetch fails', () => {
    const error = new Error('unavailable')
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [HIDDEN_AUCTION] }, error }))

    const { result } = renderAuction()

    expect(result.current).toEqual({ status: TokenDetailsSourceState.Error, error })
  })

  it('keeps the resolved source stable when the query state does not change', () => {
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [AUCTION] } }))

    const { result, rerender } = renderAuction()
    const source = result.current

    rerender()

    expect(result.current).toBe(source)
  })

  it('returns not found only after a successful empty response', () => {
    mockUseQuery.mockReturnValue(queryResult({ data: { auctions: [] }, isSuccess: true }))

    const { result } = renderAuction()

    expect(result.current.status).toBe(TokenDetailsSourceState.NotFound)
  })

  it('stays loading before an empty response succeeds', () => {
    const { result } = renderAuction()

    expect(result.current.status).toBe(TokenDetailsSourceState.Loading)
  })

  it('returns query errors distinctly', () => {
    const error = new Error('unavailable')
    mockUseQuery.mockReturnValue(queryResult({ error }))

    const { result } = renderAuction()

    expect(result.current).toMatchObject({ status: TokenDetailsSourceState.Error, error })
  })
})

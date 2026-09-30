import type { PartialMessage } from '@bufbuild/protobuf'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuctionType } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import {
  type GetTokenHistoryPriceRequest,
  GetTokenHistoryPriceResponse,
  type GetTokenMarketsRequest,
  GetTokenMarketsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  HistoryDuration,
  type TokenMarket,
  type TokenMarketStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { NowTradingCard } from '~/features/Toucan/Auction/NowTradingCard'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { act, fireEvent, render, screen, waitFor } from '~/test-utils/render'

const { mockGetTokenMarkets, mockGetTokenHistoryPrice, mockSparklineChart } = vi.hoisted(() => ({
  mockGetTokenMarkets: vi.fn<(request: PartialMessage<GetTokenMarketsRequest>) => Promise<GetTokenMarketsResponse>>(),
  mockGetTokenHistoryPrice:
    vi.fn<(request: PartialMessage<GetTokenHistoryPriceRequest>) => Promise<GetTokenHistoryPriceResponse>>(),
  mockSparklineChart: vi.fn(() => null),
}))
const mockNavigate = vi.fn()
const mockPrefetchAuction = vi.fn()
vi.mock('~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction', () => ({
  usePrefetchTokenDetailsAuction: () => mockPrefetchAuction,
}))
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayState', () => ({
  useAuctionDisplayState: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: {
    getTokenMarkets: mockGetTokenMarkets,
    getTokenHistoryPrice: mockGetTokenHistoryPrice,
  },
}))
vi.mock('~/components/Charts/SparklineChart', () => ({ SparklineChart: mockSparklineChart }))
const mockIsTradingRestrictedUntilTge = vi.fn(() => false)
vi.mock('~/features/Toucan/Config/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Toucan/Config/config')>()),
  isTradingRestrictedUntilTge: () => mockIsTradingRestrictedUntilTge(),
}))
vi.mock('use-resize-observer', () => ({ default: () => ({ ref: vi.fn(), width: 320 }) }))

const TOKEN_ADDRESS = '0xE172e9B6cfBeeB5593bDcE3f077356FDb33af904'
const TOKEN_IDENTIFIER = { chainId: UniverseChainId.Mainnet, address: TOKEN_ADDRESS.toLowerCase() }
let mockAuctionType: AuctionType
let mockChainId: UniverseChainId
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: unknown) => unknown) =>
    selector({
      auctionDetails: {
        chainId: mockChainId,
        tokenAddress: TOKEN_ADDRESS,
        tokenSymbol: 'FOLD',
        endBlock: '25952698',
        auctionType: mockAuctionType,
        isQuickLaunch: mockAuctionType === AuctionType.CROWD,
        fdvUsd: '34694059',
      },
      tokenColor: '#4C82FB',
    }),
}))

const ENDED_WITH_POOL: AuctionDisplayState = {
  phase: AuctionDisplayPhase.Ended,
  result: AuctionDisplayResult.Successful,
  poolAvailability: PoolAvailability.HasPool,
  shouldShowSwap: true,
}

function createMarket(
  stats: PartialMessage<TokenMarketStats>,
  overrides: PartialMessage<TokenMarket> = {},
): PartialMessage<TokenMarket> {
  return { ...TOKEN_IDENTIFIER, stats, ...overrides }
}

function renderCard(): { queryClient: QueryClient } {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(
    <QueryClientProvider client={queryClient}>
      <NowTradingCard />
    </QueryClientProvider>,
  )
  return { queryClient }
}

describe('NowTradingCard', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockPrefetchAuction.mockClear()
    mockSparklineChart.mockClear()
    mockGetTokenMarkets.mockReset().mockResolvedValue(new GetTokenMarketsResponse())
    mockGetTokenHistoryPrice.mockReset().mockResolvedValue(new GetTokenHistoryPriceResponse())
    mockAuctionType = AuctionType.CROWD
    mockChainId = UniverseChainId.Mainnet
    mockIsTradingRestrictedUntilTge.mockReturnValue(false)
    vi.mocked(useAuctionDisplayState).mockReturnValue(ENDED_WITH_POOL)
  })

  it('stays hidden while trading is restricted until the TGE', () => {
    mockIsTradingRestrictedUntilTge.mockReturnValue(true)
    renderCard()

    expect(screen.queryByTestId(TestID.ToucanNowTradingCard)).toBeNull()
  })

  it('warms the token auction lookup before navigation on hover, focus, and activation', () => {
    renderCard()
    const card = screen.getByTestId(TestID.ToucanNowTradingCard)
    const button = screen.getByRole('button', { name: 'Trade FOLD →' })

    fireEvent.mouseEnter(card)
    fireEvent.focus(button)
    expect(mockPrefetchAuction).toHaveBeenCalledTimes(2)
    expect(mockNavigate).not.toHaveBeenCalled()

    fireEvent.click(button)
    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
    })
    expect(mockPrefetchAuction).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('shows market stats and links to the token details page', async () => {
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({
        markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000, volumeUsd: 218_200 })],
      }),
    )
    renderCard()

    expect((await screen.findByText(/FDV$/)).textContent).toMatch(/1\.2M/)
    expect(screen.getByText(/24H vol$/).textContent).toMatch(/218\.2K/)
    expect(screen.getByText('FOLD is now trading')).toBeDefined()
    fireEvent.click(screen.getByText('Trade FOLD →'))
    expect(mockNavigate.mock.calls[0]?.[0]).toMatch(new RegExp(`^/explore/tokens/ethereum/${TOKEN_ADDRESS}$`, 'i'))
  })

  it.each([
    ['quick', AuctionType.CROWD],
    ['custom', AuctionType.CUSTOM],
    ['unclassified', AuctionType.UNSPECIFIED],
  ] as const)('requests token market data directly for a %s auction', async (_label, auctionType) => {
    mockAuctionType = auctionType
    renderCard()

    await waitFor(() =>
      expect(mockGetTokenMarkets).toHaveBeenCalledWith({
        tokens: [TOKEN_IDENTIFIER],
        duration: HistoryDuration.DAY,
      }),
    )
  })

  it('uses the route slug when the GraphQL chain name differs', () => {
    mockChainId = UniverseChainId.UnichainSepolia
    renderCard()

    fireEvent.click(screen.getByText('Trade FOLD →'))

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/tokens/unichain_sepolia/${TOKEN_ADDRESS}`)
    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.UnichainSepolia,
      tokenAddress: TOKEN_ADDRESS,
    })
  })

  it('uses the actual single-chain 24-hour price history for the chart', async () => {
    mockGetTokenHistoryPrice.mockResolvedValue(
      new GetTokenHistoryPriceResponse({
        points: [
          { timestamp: 1_000n, priceUsd: 0.5 },
          { timestamp: 2_000n, priceUsd: 0.7 },
        ],
      }),
    )
    renderCard()

    await waitFor(() => expect(mockSparklineChart).toHaveBeenCalled())
    expect(mockGetTokenHistoryPrice).toHaveBeenCalledWith({
      target: { case: 'singleChain', value: TOKEN_IDENTIFIER },
      duration: HistoryDuration.DAY,
    })
    expect(mockSparklineChart.mock.calls).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.objectContaining({
            sparklineMap: {
              'auction-token': [
                { timestamp: 1_000, value: 0.5 },
                { timestamp: 2_000, value: 0.7 },
              ],
            },
          }),
        ]),
      ]),
    )
  })

  it.each([
    ['different chain', { chainId: UniverseChainId.Base }],
    ['different token', { address: '0x0000000000000000000000000000000000000001' }],
  ] satisfies [string, PartialMessage<TokenMarket>][])('omits stats for a %s', async (_label, overrides) => {
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({
        markets: [createMarket({ fullyDilutedValuationUsd: 9_000_000, volumeUsd: 218_200 }, overrides)],
      }),
    )
    const { queryClient } = renderCard()

    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(screen.queryByText(/FDV/)).toBeNull()
    expect(screen.queryByText(/24H vol/)).toBeNull()
  })

  it('matches token addresses regardless of EVM casing', async () => {
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({
        markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000 }, { address: TOKEN_ADDRESS })],
      }),
    )
    renderCard()

    expect((await screen.findByText(/FDV$/)).textContent).toMatch(/1\.2M/)
  })

  it('shows volume independently without falling back to projected FDV', async () => {
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({ markets: [createMarket({ volumeUsd: 218_200 })] }),
    )
    renderCard()

    expect((await screen.findByText(/24H vol$/)).textContent).toMatch(/218\.2K/)
    expect(screen.queryByText(/FDV/)).toBeNull()
  })

  it.each([0, -1, NaN, Infinity, -Infinity])('omits invalid market FDV: %s', async (fullyDilutedValuationUsd) => {
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({ markets: [createMarket({ fullyDilutedValuationUsd, volumeUsd: 218_200 })] }),
    )
    renderCard()

    await screen.findByText(/24H vol$/)
    expect(screen.queryByText(/FDV/)).toBeNull()
  })

  it.each([0, -1, NaN, Infinity, -Infinity])('omits invalid volume: %s', async (volumeUsd) => {
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({ markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000, volumeUsd })] }),
    )
    renderCard()

    await screen.findByText(/FDV$/)
    expect(screen.queryByText(/24H vol/)).toBeNull()
  })

  it('omits missing data without an unavailable message or fabricated chart', async () => {
    const { queryClient } = renderCard()

    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(screen.queryByText(/FDV/)).toBeNull()
    expect(screen.queryByText('Market stats unavailable')).toBeNull()
    expect(mockSparklineChart).not.toHaveBeenCalled()
    expect(screen.getByText('Trade FOLD →')).toBeDefined()
  })

  it('shows newly indexed stats after a refetch', async () => {
    const { queryClient } = renderCard()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({ markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000 })] }),
    )
    await act(async () => {
      await queryClient.refetchQueries()
    })

    expect((await screen.findByText(/FDV$/)).textContent).toMatch(/1\.2M/)
  })

  it('keeps the Trade action available after market and chart errors', async () => {
    mockGetTokenMarkets.mockRejectedValue(new Error('Market data unavailable'))
    mockGetTokenHistoryPrice.mockRejectedValue(new Error('History unavailable'))
    const { queryClient } = renderCard()

    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .getAll()
          .every((query) => query.state.status === 'error'),
      ).toBe(true),
    )
    expect(screen.queryByText(/FDV/)).toBeNull()
    expect(screen.queryByText('Market stats unavailable')).toBeNull()
    expect(screen.getByText('Trade FOLD →')).toBeDefined()
  })

  it.each([
    ['bidding is live', { ...ENDED_WITH_POOL, phase: AuctionDisplayPhase.Live }],
    ['no pool exists', { ...ENDED_WITH_POOL, poolAvailability: PoolAvailability.NoPool }],
    ['the auction failed', { ...ENDED_WITH_POOL, result: AuctionDisplayResult.Failed }],
    ['provenance is disabled', undefined],
  ] as const)('does not render or fetch while %s', (_label, displayState) => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(displayState)
    renderCard()

    expect(screen.queryByTestId(TestID.ToucanNowTradingCard)).toBeNull()
    expect(mockGetTokenMarkets).not.toHaveBeenCalled()
    expect(mockGetTokenHistoryPrice).not.toHaveBeenCalled()
  })
})

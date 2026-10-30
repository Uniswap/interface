import type { PartialMessage } from '@bufbuild/protobuf'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  type GetTokenHistoryPriceRequest,
  GetTokenHistoryPriceResponse,
  type GetTokenMarketsRequest,
  GetTokenMarketsResponse,
  type GetTokenRequest,
  GetTokenResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  HistoryDuration,
  type TokenMarket,
  type TokenMarketStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { AuctionType } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import {
  getGetTokenHistoryPriceQueryOptions,
  getGetTokenMarketsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import { NowTradingCard } from '~/features/Toucan/Auction/NowTradingCard'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { act, fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.unmock('uniswap/src/features/telemetry/Trace')
// Trace's web path does not use React Navigation; avoid loading its native ESM dependency tree.
vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))

const {
  mockGetToken,
  mockGetTokenMarkets,
  mockGetTokenHistoryPrice,
  mockSparklineChart,
  mockTokenLogo,
  mockUseResizeObserver,
} = vi.hoisted(() => ({
  mockGetToken: vi.fn<(request: PartialMessage<GetTokenRequest>) => Promise<GetTokenResponse>>(),
  mockGetTokenMarkets: vi.fn<(request: PartialMessage<GetTokenMarketsRequest>) => Promise<GetTokenMarketsResponse>>(),
  mockGetTokenHistoryPrice:
    vi.fn<(request: PartialMessage<GetTokenHistoryPriceRequest>) => Promise<GetTokenHistoryPriceResponse>>(),
  mockSparklineChart: vi.fn(() => null),
  mockTokenLogo: vi.fn(() => null),
  mockUseResizeObserver: vi.fn<() => { ref: () => void; width: number | undefined }>(),
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
vi.mock('~/features/Toucan/Auction/hooks/useAuctionTradingToken', () => ({
  useAuctionTradingToken: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: {
    getToken: mockGetToken,
    getTokenMarkets: mockGetTokenMarkets,
    getTokenHistoryPrice: mockGetTokenHistoryPrice,
  },
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))
vi.mock('~/components/Charts/SparklineChart', () => ({ SparklineChart: mockSparklineChart }))
vi.mock('uniswap/src/components/CurrencyLogo/TokenLogo', () => ({ TokenLogo: mockTokenLogo }))
const mockIsTradingRestrictedUntilTge = vi.fn(() => false)
vi.mock('~/features/Toucan/Config/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Toucan/Config/config')>()),
  isTradingRestrictedUntilTge: () => mockIsTradingRestrictedUntilTge(),
}))
vi.mock('use-resize-observer', () => ({ default: mockUseResizeObserver }))

const TOKEN_ADDRESS = '0xE172e9B6cfBeeB5593bDcE3f077356FDb33af904'
const TOKEN_IDENTIFIER = { chainId: UniverseChainId.Mainnet, address: TOKEN_ADDRESS.toLowerCase() }
const RECEIPT_ADDRESS = '0x9999b7e3cc6979223ff1af980b7d8b90b75d9999'
const UNDERLYING_ADDRESS = '0x0000000000000000000000000000000000000001'
let mockAuctionType: AuctionType
let mockChainId: UniverseChainId
let mockTokenAddress: string
let mockTokenSymbol: string
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: unknown) => unknown) =>
    selector({
      auctionDetails: {
        chainId: mockChainId,
        tokenAddress: mockTokenAddress,
        tokenSymbol: mockTokenSymbol,
        tokenImageUrl: 'https://example.com/receipt.png',
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

function renderCard(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })): {
  queryClient: QueryClient
  rerender: () => void
} {
  const card = (): JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <NowTradingCard />
    </QueryClientProvider>
  )
  const { rerender } = render(card())
  return {
    queryClient,
    rerender: () => rerender(card()),
  }
}

describe('NowTradingCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    mockNavigate.mockReset()
    mockPrefetchAuction.mockClear()
    mockSparklineChart.mockClear()
    mockTokenLogo.mockClear()
    mockUseResizeObserver.mockReset().mockReturnValue({ ref: vi.fn(), width: 320 })
    mockGetToken.mockReset().mockResolvedValue(new GetTokenResponse())
    mockGetTokenMarkets.mockReset().mockResolvedValue(new GetTokenMarketsResponse())
    mockGetTokenHistoryPrice.mockReset().mockResolvedValue(new GetTokenHistoryPriceResponse())
    vi.mocked(sendAnalyticsEvent).mockClear()
    mockAuctionType = AuctionType.CROWD
    mockChainId = UniverseChainId.Mainnet
    mockTokenAddress = TOKEN_ADDRESS
    mockTokenSymbol = 'FOLD'
    vi.mocked(useAuctionTradingToken)
      .mockReset()
      .mockImplementation(({ tokenAddress }) => ({
        tradingTokenAddress: tokenAddress,
        loading: false,
      }))
    mockIsTradingRestrictedUntilTge.mockReturnValue(false)
    vi.mocked(useAuctionDisplayState).mockReturnValue(ENDED_WITH_POOL)
  })

  it('stays hidden while trading is restricted until the TGE', () => {
    mockIsTradingRestrictedUntilTge.mockReturnValue(true)
    renderCard()

    expect(screen.queryByTestId(TestID.ToucanNowTradingCard)).toBeNull()
  })

  it('does not resolve a trading destination when provenance is disabled', () => {
    const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => undefined)
    mockTokenAddress = RECEIPT_ADDRESS
    vi.mocked(useAuctionDisplayState).mockReturnValue(undefined)

    renderCard()

    expect(screen.queryByTestId(TestID.ToucanNowTradingCard)).toBeNull()
    expect(useAuctionTradingToken).not.toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockGetTokenMarkets).not.toHaveBeenCalled()
    expect(mockGetTokenHistoryPrice).not.toHaveBeenCalled()
    expect(sendEvent).not.toHaveBeenCalledWith(AuctionEventName.AuctionBannerViewed, expect.anything())
  })

  it('warms the token auction lookup before navigation on hover, focus, and activation', async () => {
    renderCard()
    const card = screen.getByTestId(TestID.ToucanNowTradingCard)
    const button = await screen.findByRole('button', { name: 'Trade FOLD →' })

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
    expect(mockGetToken).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Trade FOLD →'))
    expect(mockNavigate.mock.calls[0]?.[0]).toMatch(new RegExp(`^/explore/tokens/ethereum/${TOKEN_ADDRESS}$`, 'i'))
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(AuctionEventName.AuctionDetailsToTokenDetailsClicked, {
      surface: 'adp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'crowd',
      launch_method: 'crowd',
      entry_point: 'auction_now_trading_card',
      token_address: TOKEN_ADDRESS,
      auction_phase: 'ended',
      pool_availability: 'has_pool',
      page_layout: 'trading',
    })
  })

  it('uses the underlying token metadata, market data, history, and destination for a receipt auction', async () => {
    mockTokenAddress = RECEIPT_ADDRESS
    mockTokenSymbol = 'rCAP'
    vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: UNDERLYING_ADDRESS, loading: false })
    const underlying = { chainId: UniverseChainId.Mainnet, address: UNDERLYING_ADDRESS }
    mockGetToken.mockResolvedValue(
      new GetTokenResponse({
        token: { ...underlying, symbol: 'CAP', project: { logoUrl: 'https://example.com/cap.png' } },
      }),
    )
    mockGetTokenMarkets.mockResolvedValue(
      new GetTokenMarketsResponse({
        markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000 }, underlying)],
      }),
    )
    renderCard()

    const button = await screen.findByRole('button', { name: 'Trade CAP →' })
    expect(screen.getByText('CAP is now trading')).toBeDefined()
    expect(screen.queryByText('rCAP is now trading')).toBeNull()
    expect(screen.getByText(/FDV$/).textContent).toMatch(/1\.2M/)
    expect(mockGetToken).toHaveBeenCalledExactlyOnceWith(underlying)
    expect(mockGetTokenMarkets).toHaveBeenCalledExactlyOnceWith({ tokens: [underlying], duration: HistoryDuration.DAY })
    expect(mockGetTokenHistoryPrice).toHaveBeenCalledExactlyOnceWith({
      target: { case: 'singleChain', value: underlying },
      duration: HistoryDuration.DAY,
    })
    expect(mockTokenLogo.mock.lastCall).toEqual(
      expect.arrayContaining([expect.objectContaining({ symbol: 'CAP', url: 'https://example.com/cap.png' })]),
    )

    fireEvent.click(button)

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/tokens/ethereum/${UNDERLYING_ADDRESS}`)
    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: UNDERLYING_ADDRESS,
    })
  })

  it('does not fall back to receipt data while the trading token is unresolved', () => {
    mockTokenAddress = RECEIPT_ADDRESS
    mockTokenSymbol = 'rCAP'
    vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: undefined, loading: true })
    renderCard()

    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(/rCAP/)).toBeNull()
    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockGetTokenMarkets).not.toHaveBeenCalled()
    expect(mockGetTokenHistoryPrice).not.toHaveBeenCalled()
    expect(mockPrefetchAuction).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
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

  it('uses the route slug when the GraphQL chain name differs', async () => {
    mockChainId = UniverseChainId.UnichainSepolia
    renderCard()

    fireEvent.click(await screen.findByRole('button', { name: 'Trade FOLD →' }))

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

  it.each(['market', 'history'] as const)(
    'keeps the card loading until the initial %s request settles',
    async (last) => {
      const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => undefined)
      const market = Promise.withResolvers<GetTokenMarketsResponse>()
      const history = Promise.withResolvers<GetTokenHistoryPriceResponse>()
      const marketResponse = new GetTokenMarketsResponse({
        markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000, volumeUsd: 218_200 })],
      })
      const historyResponse = new GetTokenHistoryPriceResponse({
        points: [
          { timestamp: 1_000n, priceUsd: 0.5 },
          { timestamp: 2_000n, priceUsd: 0.7 },
        ],
      })
      mockGetTokenMarkets.mockReturnValue(market.promise)
      mockGetTokenHistoryPrice.mockReturnValue(history.promise)
      const { queryClient, rerender } = renderCard()
      const card = screen.getByTestId(TestID.ToucanNowTradingCard)

      expect(card).toHaveAttribute('aria-busy', 'true')
      expect(sendEvent).not.toHaveBeenCalledWith(AuctionEventName.AuctionBannerViewed, expect.anything())
      expect(screen.queryByText('FOLD is now trading')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Trade FOLD →' })).toBeNull()
      expect(mockSparklineChart).not.toHaveBeenCalled()

      await act(async () => {
        if (last === 'market') {
          history.resolve(historyResponse)
        } else {
          market.resolve(marketResponse)
        }
      })
      await waitFor(() => expect(queryClient.isFetching()).toBe(1))
      expect(sendEvent).not.toHaveBeenCalledWith(AuctionEventName.AuctionBannerViewed, expect.anything())
      expect(card).toHaveAttribute('aria-busy', 'true')
      expect(screen.queryByText('FOLD is now trading')).toBeNull()
      expect(screen.queryByText(/FDV$/)).toBeNull()
      expect(screen.queryByRole('button', { name: 'Trade FOLD →' })).toBeNull()
      expect(mockSparklineChart).not.toHaveBeenCalled()

      await act(async () => {
        market.resolve(marketResponse)
        history.resolve(historyResponse)
      })

      expect(await screen.findByRole('button', { name: 'Trade FOLD →' })).toBeDefined()
      expect(card).not.toHaveAttribute('aria-busy', 'true')
      expect(screen.getByText('FOLD is now trading')).toBeDefined()
      expect(screen.getByText(/FDV$/).textContent).toMatch(/1\.2M/)
      expect(mockSparklineChart).toHaveBeenCalled()
      // Let Trace's 50ms development dedupe expire before checking subsequent renders.
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 51)))
      rerender()

      const impressions = sendEvent.mock.calls.filter(([event]) => event === AuctionEventName.AuctionBannerViewed)
      expect(impressions).toHaveLength(1)
      expect(impressions[0]?.[1]).toMatchObject({
        surface: 'adp',
        entry_point: 'auction_now_trading_card',
        auction_phase: 'ended',
      })
    },
  )

  it.each([undefined, 0])('keeps content visible while waiting for a positive chart width: %s', async (width) => {
    mockUseResizeObserver.mockReturnValue({ ref: vi.fn(), width })
    mockGetTokenHistoryPrice.mockResolvedValue(
      new GetTokenHistoryPriceResponse({
        points: [
          { timestamp: 1_000n, priceUsd: 0.5 },
          { timestamp: 2_000n, priceUsd: 0.7 },
        ],
      }),
    )
    const { queryClient, rerender } = renderCard()

    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).not.toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('FOLD is now trading')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Trade FOLD →' })).toBeDefined()
    expect(mockSparklineChart).not.toHaveBeenCalled()

    mockUseResizeObserver.mockReturnValue({ ref: vi.fn(), width: 320 })
    rerender()

    expect(await screen.findByRole('button', { name: 'Trade FOLD →' })).toBeDefined()
    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).not.toHaveAttribute('aria-busy', 'true')
    expect(mockSparklineChart.mock.lastCall).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 320, height: 111 })]),
    )
  })

  it('keeps a cached card visible when its first chart arrives before measurement', async () => {
    mockUseResizeObserver.mockReturnValue({ ref: vi.fn(), width: undefined })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: Infinity } },
    })
    const marketResponse = new GetTokenMarketsResponse({
      markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000 })],
    })
    mockGetTokenMarkets.mockResolvedValue(marketResponse)
    queryClient.setQueryData(
      getGetTokenMarketsQueryOptions({
        params: { tokens: [TOKEN_IDENTIFIER], duration: HistoryDuration.DAY },
      }).queryKey,
      marketResponse,
    )
    queryClient.setQueryData(
      getGetTokenHistoryPriceQueryOptions({
        params: {
          target: { case: 'singleChain', value: TOKEN_IDENTIFIER },
          duration: HistoryDuration.DAY,
        },
      }).queryKey,
      new GetTokenHistoryPriceResponse(),
    )
    const { rerender } = renderCard(queryClient)
    const button = screen.getByRole('button', { name: 'Trade FOLD →' })
    const title = screen.getByText('FOLD is now trading')
    const stats = screen.getByText(/FDV$/)
    mockGetTokenHistoryPrice.mockResolvedValue(
      new GetTokenHistoryPriceResponse({
        points: [
          { timestamp: 1_000n, priceUsd: 0.5 },
          { timestamp: 2_000n, priceUsd: 0.7 },
        ],
      }),
    )

    await act(async () => {
      await queryClient.refetchQueries()
    })

    expect(screen.getByRole('button', { name: 'Trade FOLD →' })).toBe(button)
    expect(screen.getByText('FOLD is now trading')).toBe(title)
    expect(screen.getByText(/FDV$/)).toBe(stats)
    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).not.toHaveAttribute('aria-busy', 'true')
    expect(mockSparklineChart).not.toHaveBeenCalled()

    mockUseResizeObserver.mockReturnValue({ ref: vi.fn(), width: 320 })
    rerender()

    expect(mockSparklineChart).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Trade FOLD →' })).toBe(button)
  })

  it('keeps cached content visible while market and history data refresh', async () => {
    const marketResponse = new GetTokenMarketsResponse({
      markets: [createMarket({ fullyDilutedValuationUsd: 1_230_000 })],
    })
    const historyResponse = new GetTokenHistoryPriceResponse({
      points: [
        { timestamp: 1_000n, priceUsd: 0.5 },
        { timestamp: 2_000n, priceUsd: 0.7 },
      ],
    })
    mockGetTokenMarkets.mockResolvedValue(marketResponse)
    mockGetTokenHistoryPrice.mockResolvedValue(historyResponse)
    const { queryClient } = renderCard()
    const button = await screen.findByRole('button', { name: 'Trade FOLD →' })
    const market = Promise.withResolvers<GetTokenMarketsResponse>()
    const history = Promise.withResolvers<GetTokenHistoryPriceResponse>()
    mockGetTokenMarkets.mockReturnValue(market.promise)
    mockGetTokenHistoryPrice.mockReturnValue(history.promise)

    await act(async () => {
      void queryClient.refetchQueries()
    })

    await waitFor(() => expect(queryClient.isFetching()).toBe(2))
    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).not.toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Trade FOLD →' })).toBe(button)
    expect(screen.getByText('FOLD is now trading')).toBeDefined()
    expect(screen.getByText(/FDV$/).textContent).toMatch(/1\.2M/)
    expect(mockSparklineChart).toHaveBeenCalled()

    await act(async () => {
      market.resolve(marketResponse)
      history.resolve(historyResponse)
    })
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
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
    mockUseResizeObserver.mockReturnValue({ ref: vi.fn(), width: undefined })
    const { queryClient } = renderCard()

    expect(await screen.findByRole('button', { name: 'Trade FOLD →' })).toBeDefined()
    expect(queryClient.isFetching()).toBe(0)
    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).not.toHaveAttribute('aria-busy', 'true')
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

  it('keeps the Trade action available after market and chart errors and during a retry', async () => {
    mockGetTokenMarkets.mockRejectedValue(new Error('Market data unavailable'))
    mockGetTokenHistoryPrice.mockRejectedValue(new Error('History unavailable'))
    mockUseResizeObserver.mockReturnValue({ ref: vi.fn(), width: undefined })
    const { queryClient } = renderCard()

    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .getAll()
          .filter((query) => query.isActive())
          .every((query) => query.state.status === 'error'),
      ).toBe(true),
    )
    expect(await screen.findByRole('button', { name: 'Trade FOLD →' })).toBeDefined()
    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).not.toHaveAttribute('aria-busy', 'true')
    expect(mockSparklineChart).not.toHaveBeenCalled()
    expect(screen.queryByText(/FDV/)).toBeNull()
    expect(screen.queryByText('Market stats unavailable')).toBeNull()
    expect(screen.getByText('Trade FOLD →')).toBeDefined()

    const market = Promise.withResolvers<GetTokenMarketsResponse>()
    const history = Promise.withResolvers<GetTokenHistoryPriceResponse>()
    mockGetTokenMarkets.mockReturnValue(market.promise)
    mockGetTokenHistoryPrice.mockReturnValue(history.promise)
    await act(async () => {
      void queryClient.refetchQueries()
    })

    await waitFor(() => expect(queryClient.isFetching()).toBe(2))
    expect(screen.getByRole('button', { name: 'Trade FOLD →' })).toBeDefined()
    expect(screen.getByTestId(TestID.ToucanNowTradingCard)).not.toHaveAttribute('aria-busy', 'true')
    expect(mockSparklineChart).not.toHaveBeenCalled()

    await act(async () => {
      market.resolve(new GetTokenMarketsResponse())
      history.resolve(new GetTokenHistoryPriceResponse())
    })
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
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

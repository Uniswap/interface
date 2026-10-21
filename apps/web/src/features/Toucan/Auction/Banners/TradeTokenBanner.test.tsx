import type { PartialMessage } from '@bufbuild/protobuf'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type GetTokenRequest, GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TradeTokenBanner } from '~/features/Toucan/Auction/Banners/TradeTokenBanner'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { act, fireEvent, render, screen } from '~/test-utils/render'

vi.unmock('uniswap/src/features/telemetry/Trace')
// Trace's web path does not use React Navigation; avoid loading its native ESM dependency tree.
vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))

const { mockGetToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn<(request: PartialMessage<GetTokenRequest>) => Promise<GetTokenResponse>>(),
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
  dataApiServiceClientV2: { getToken: mockGetToken },
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const TOKEN_ADDRESS = '0xE172e9B6cfBeeB5593bDcE3f077356FDb33af904'
const RECEIPT_ADDRESS = '0x9999b7e3cc6979223ff1af980b7d8b90b75d9999'
const UNDERLYING_ADDRESS = '0x0000000000000000000000000000000000000001'
const mockStoreState = {
  auctionDetails: { chainId: UniverseChainId.Mainnet, tokenAddress: TOKEN_ADDRESS, tokenSymbol: 'FOLD' },
  tokenColor: '#4C82FB',
}
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

const LIVE_WITH_POOL: AuctionDisplayState = {
  phase: AuctionDisplayPhase.Live,
  result: AuctionDisplayResult.Unknown,
  poolAvailability: PoolAvailability.HasPool,
  shouldShowSwap: true,
}

function renderBanner(): { rerender: () => void } {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const banner = (): JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <TradeTokenBanner />
    </QueryClientProvider>
  )
  const { rerender } = render(banner())
  return { rerender: () => rerender(banner()) }
}

describe('TradeTokenBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    mockNavigate.mockReset()
    mockPrefetchAuction.mockClear()
    mockGetToken.mockReset().mockResolvedValue(new GetTokenResponse())
    mockStoreState.auctionDetails.chainId = UniverseChainId.Mainnet
    mockStoreState.auctionDetails.tokenAddress = TOKEN_ADDRESS
    mockStoreState.auctionDetails.tokenSymbol = 'FOLD'
    vi.mocked(useAuctionTradingToken)
      .mockReset()
      .mockImplementation(({ tokenAddress }) => ({
        tradingTokenAddress: tokenAddress,
        loading: false,
      }))
    vi.mocked(sendAnalyticsEvent).mockClear()
  })

  it('links to the token details page of the auctioned token', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)

    renderBanner()
    fireEvent.click(screen.getByText('Buy or sell FOLD'))

    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate.mock.calls[0]?.[0]).toMatch(new RegExp(`^/explore/tokens/ethereum/${TOKEN_ADDRESS}$`, 'i'))
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(AuctionEventName.AuctionDetailsToTokenDetailsClicked, {
      surface: 'adp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'unknown',
      launch_method: 'unknown',
      entry_point: 'adp_trade_token_banner',
      auction_phase: 'live',
      pool_availability: 'has_pool',
      page_layout: 'trading',
    })
  })

  it('shows and links to the underlying token when the auction distributes receipts', async () => {
    mockStoreState.auctionDetails.tokenAddress = RECEIPT_ADDRESS
    mockStoreState.auctionDetails.tokenSymbol = 'rCAP'
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)
    vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: UNDERLYING_ADDRESS, loading: false })
    mockGetToken.mockResolvedValue(
      new GetTokenResponse({
        token: { chainId: UniverseChainId.Mainnet, address: UNDERLYING_ADDRESS, symbol: 'CAP' },
      }),
    )
    renderBanner()

    fireEvent.click(await screen.findByRole('button', { name: 'Buy or sell CAP' }))

    expect(screen.queryByText('Buy or sell rCAP')).toBeNull()
    expect(mockGetToken).toHaveBeenCalledExactlyOnceWith({
      chainId: UniverseChainId.Mainnet,
      address: UNDERLYING_ADDRESS,
    })
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/tokens/ethereum/${UNDERLYING_ADDRESS}`)
    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: UNDERLYING_ADDRESS,
    })
  })

  it('hides the trade link until the underlying token resolves', () => {
    mockStoreState.auctionDetails.tokenAddress = RECEIPT_ADDRESS
    mockStoreState.auctionDetails.tokenSymbol = 'rCAP'
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)
    vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: undefined, loading: true })
    renderBanner()

    expect(screen.queryByTestId(TestID.ToucanTradeTokenBanner)).toBeNull()
    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockPrefetchAuction).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('waits for underlying metadata before revealing the trade label', async () => {
    const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => undefined)
    mockStoreState.auctionDetails.tokenAddress = RECEIPT_ADDRESS
    mockStoreState.auctionDetails.tokenSymbol = 'rCAP'
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)
    vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: UNDERLYING_ADDRESS, loading: false })
    const metadata = Promise.withResolvers<GetTokenResponse>()
    mockGetToken.mockReturnValue(metadata.promise)
    const { rerender } = renderBanner()

    expect(screen.queryByTestId(TestID.ToucanTradeTokenBanner)).toBeNull()
    expect(sendEvent).not.toHaveBeenCalledWith(AuctionEventName.AuctionBannerViewed, expect.anything())

    await act(async () => {
      metadata.resolve(
        new GetTokenResponse({
          token: { chainId: UniverseChainId.Mainnet, address: UNDERLYING_ADDRESS, symbol: 'CAP' },
        }),
      )
    })

    expect(await screen.findByRole('button', { name: 'Buy or sell CAP' })).toBeDefined()
    expect(screen.queryByText('Buy or sell Token')).toBeNull()
    // Let Trace's 50ms development dedupe expire before checking subsequent renders.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 51)))
    rerender()

    const impressions = sendEvent.mock.calls.filter(([event]) => event === AuctionEventName.AuctionBannerViewed)
    expect(impressions).toHaveLength(1)
    expect(impressions[0]?.[1]).toMatchObject({
      surface: 'adp',
      entry_point: 'adp_trade_token_banner',
      auction_phase: 'live',
    })
  })

  it('renders nothing while the pool lookup is still loading', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue({ ...LIVE_WITH_POOL, poolAvailability: PoolAvailability.Loading })

    renderBanner()

    expect(screen.queryByTestId(TestID.ToucanTradeTokenBanner)).toBeNull()
  })

  it('does not resolve a trading destination when provenance is disabled', () => {
    const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => undefined)
    mockStoreState.auctionDetails.tokenAddress = RECEIPT_ADDRESS
    vi.mocked(useAuctionDisplayState).mockReturnValue(undefined)

    renderBanner()

    expect(screen.queryByTestId(TestID.ToucanTradeTokenBanner)).toBeNull()
    expect(useAuctionTradingToken).not.toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
    expect(mockGetToken).not.toHaveBeenCalled()
    expect(sendEvent).not.toHaveBeenCalledWith(AuctionEventName.AuctionBannerViewed, expect.anything())
  })

  it('uses the route slug when the GraphQL chain name differs', () => {
    mockStoreState.auctionDetails.chainId = UniverseChainId.UnichainSepolia
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)

    renderBanner()
    fireEvent.click(screen.getByText('Buy or sell FOLD'))

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/tokens/unichain_sepolia/${TOKEN_ADDRESS}`)
    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.UnichainSepolia,
      tokenAddress: TOKEN_ADDRESS,
    })
  })

  it('warms the token auction lookup on hover, focus, and activation without navigating early', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)
    renderBanner()
    const button = screen.getByRole('button', { name: 'Buy or sell FOLD' })

    fireEvent.mouseEnter(button)
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

  it('tints the trade link with the extracted token color', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)

    renderBanner()

    const banner = screen.getByTestId(TestID.ToucanTradeTokenBanner)
    expect(getOwnStyleProp(banner, 'backgroundColor')).toBe('#4C82FB14')
    expect(getOwnStyleProp(banner, 'borderColor')).toBe('#4C82FB14')
  })
})

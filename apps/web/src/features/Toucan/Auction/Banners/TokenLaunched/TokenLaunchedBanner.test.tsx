import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TokenLaunchedBanner } from '~/features/Toucan/Auction/Banners/TokenLaunched/TokenLaunchedBanner'
import { useTokenLaunchedBannerPriceData } from '~/features/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerPriceData'
import { useAuctionRedemption } from '~/features/Toucan/Auction/hooks/useAuctionRedemption'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import { AuctionCheckpointLoadState, AuctionDetails, AuctionOutcome } from '~/features/Toucan/Auction/store/types'
import { useTokenPoolState } from '~/hooks/useTokenPoolState'
import { render, screen } from '~/test-utils/render'
import type { TokenPoolState } from '~/types/tokenPool'

// The graduated path is gated behind live price data, which never resolves in jsdom — without
// these the "graduated" cases would silently render the skeleton and any assertion about the
// launched banner would be vacuous. Both are stubbed as resolved-with-data so the banner gets
// past its price loading gate; `hasMarketPrice: false` keeps the CTA on the pre-trade copy.
vi.mock('~/features/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerPriceData', () => ({
  useTokenLaunchedBannerPriceData: vi.fn(),
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionRedemption', () => ({
  useAuctionRedemption: vi.fn(),
}))
vi.mock('~/hooks/useTokenPoolState', () => ({ useTokenPoolState: vi.fn() }))
vi.mock('~/features/Toucan/Auction/Banners/TokenLaunched/useRealTokenMarketInfo', () => ({
  useRealTokenMarketInfo: () => ({ name: 'Cap', fdvUsd: 558_030_615, loading: false }),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries', () => ({
  auctionQueries: {
    getClearingPriceHistory: () => ({
      queryKey: ['banner-clearing-price-history'],
      queryFn: async () => ({ changes: [] }),
      initialData: { changes: [] },
    }),
  },
}))
vi.mock('~/features/Toucan/Auction/hooks/useBidTokenInfo', () => ({
  useBidTokenInfo: () => ({
    bidTokenInfo: { symbol: 'ETH', decimals: 18, priceFiat: 2000, isStablecoin: false, logoUrl: null },
    loading: false,
  }),
}))

// Real prod values for the launch that reported "failed to launch" while 20.7x oversubscribed.
const AUCTION_ADDRESS = '0x9D908e12c463e6ae0f074bF3Af56DedeD0cA1949'
const TOKEN_NAME = 'RHPS'
const START_BLOCK = '29498515'
const END_BLOCK = '29642515'
const ENDED_BLOCK = 29_642_600
const REQUIRED_CURRENCY_RAISED = '2617870778999999999'
const RAISED_ABOVE_TARGET = '51136794821184367788'
const RAISED_BELOW_TARGET = '1000000000000000000'
// Hex, like the real page passes: the extracted token color drives the banner gradient.
const TOKEN_COLOR = '#4C82FB'

const FAILED_HEADING = `${TOKEN_NAME} failed to launch`
const FAILED_SUBHEADING = 'This auction did not reach the minimum sale threshold and failed to launch.'
// The launched banner's pre-trade copy — the positive counterpart to the failure strings, so a
// graduated auction has to prove it rendered its own banner rather than merely avoiding the
// failure one.
const LAUNCHED_COPY = 'Available to trade soon'
const CAP_ADDRESS = '0x99991c6aabba5a096f24f250b73580f5179b9999'
const RCAP_ADDRESS = '0x9999b7e3cc6979223ff1af980b7d8b90b75d9999'

beforeEach(() => {
  vi.mocked(useTokenLaunchedBannerPriceData)
    .mockReset()
    .mockReturnValue({
      data: { priceSeries: [], currentTickValue: 1.23, changePercentage: 0 },
      loading: false,
      hasMarketPrice: false,
    })
  vi.mocked(useAuctionRedemption).mockReset().mockReturnValue({
    isRedeemable: false,
    realTokenAddress: undefined,
    redeemUrl: undefined,
    chainId: UniverseChainId.Mainnet,
    loading: false,
  })
  vi.mocked(useTokenPoolState)
    .mockReset()
    .mockReturnValue({ poolState: { status: 'loading' }, refetch: vi.fn() })
})

function makeAuctionDetails(): AuctionDetails {
  return {
    address: AUCTION_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    tokenAddress: '0xE2C24A2394415EA928653f27c74684C95057B13B',
    currency: '0x0000000000000000000000000000000000000000',
    startBlock: START_BLOCK,
    endBlock: END_BLOCK,
    requiredCurrencyRaised: REQUIRED_CURRENCY_RAISED,
  } as AuctionDetails
}

/**
 * Mounts the banner over a real auction store so the outcome comes out of the production
 * derivation rather than a hand-set flag.
 *
 * @param currencyRaised - `undefined` leaves checkpointData null, as an absent checkpoint does.
 * @param checkpointLoadState - Whether that checkpoint request settled, and how.
 */
function renderBanner({
  currencyRaised,
  checkpointLoadState,
  isTradeAvailableFromStatus = false,
  auctionDetails,
}: {
  currencyRaised: string | undefined
  checkpointLoadState: AuctionCheckpointLoadState
  isTradeAvailableFromStatus?: boolean
  auctionDetails?: Partial<AuctionDetails>
}) {
  const store = createAuctionStore(AUCTION_ADDRESS, UniverseChainId.Mainnet)
  const { actions } = store.getState()
  actions.setAuctionDetails({ ...makeAuctionDetails(), ...auctionDetails })
  actions.setCheckpointData(currencyRaised === undefined ? null : ({ currencyRaised } as PlainMessage<Checkpoint>))
  actions.setCheckpointLoadState(checkpointLoadState)
  actions.setCurrentBlockNumberAndUpdateProgress(ENDED_BLOCK)

  function Wrapper({ children }: PropsWithChildren) {
    return <AuctionStoreContext.Provider value={store}>{children}</AuctionStoreContext.Provider>
  }

  render(
    <Wrapper>
      <TokenLaunchedBanner
        tokenName={TOKEN_NAME}
        tokenColor={TOKEN_COLOR}
        tokenTotalSupply="500000000000000000000000000"
        auctionTokenDecimals={18}
        isTradeAvailableFromStatus={isTradeAvailableFromStatus}
        tradeAvailabilityBlock={undefined}
      />
    </Wrapper>,
  )

  return store.getState().progress.outcome
}

function expectNoFailureClaim() {
  expect(screen.queryByText(FAILED_HEADING)).toBeNull()
  expect(screen.queryByText(FAILED_SUBHEADING)).toBeNull()
}

describe('TokenLaunchedBanner failure state', () => {
  it('shows the skeleton, not a failure claim, while the checkpoint is in flight', () => {
    const outcome = renderBanner({
      currencyRaised: undefined,
      checkpointLoadState: AuctionCheckpointLoadState.Loading,
    })

    expect(outcome).toBe(AuctionOutcome.UNKNOWN)
    expect(screen.getByTestId(TestID.TokenLaunchedBannerSkeleton)).toBeInTheDocument()
    expectNoFailureClaim()
  })

  it('shows the skeleton, not a failure claim, when the checkpoint request errored', () => {
    // A 404 from GetLatestCheckpoint (measured: an address it cannot resolve to an auction answers
    // `not_found`) is not evidence of a shortfall, so it must not become "failed to launch" — that
    // is the original bug. It stays on the skeleton and is logged in useAuctionCheckpointDiagnostics.
    const outcome = renderBanner({
      currencyRaised: undefined,
      checkpointLoadState: AuctionCheckpointLoadState.Error,
    })

    expect(outcome).toBe(AuctionOutcome.UNKNOWN)
    expect(screen.getByTestId(TestID.TokenLaunchedBannerSkeleton)).toBeInTheDocument()
    expectNoFailureClaim()
  })

  it('shows the skeleton, not a failure claim, when a settled checkpoint carries an unreadable amount', () => {
    // Settled *with* a payload we cannot parse is not the same as settled empty. The server
    // answered and we cannot read it, which is no more evidence of a shortfall than a 404 — so it
    // holds the skeleton rather than falling through to the failure banner, and
    // useAuctionCheckpointDiagnostics logs it so the stall is not silent.
    const outcome = renderBanner({
      currencyRaised: 'not-a-number',
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.UNKNOWN)
    expect(screen.getByTestId(TestID.TokenLaunchedBannerSkeleton)).toBeInTheDocument()
    expectNoFailureClaim()
  })

  it('claims a failed launch once the checkpoint settles carrying nothing', () => {
    // Settled-and-empty on an ended auction is authoritative: nothing was ever raised. Releasing
    // here is what keeps an ended auction off an indefinite skeleton, since checkpoint polling has
    // already stopped and no retry will ever fill it in.
    const outcome = renderBanner({
      currencyRaised: undefined,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.FAILED)
    expect(screen.getByText(FAILED_HEADING)).toBeInTheDocument()
    expect(screen.getByText(FAILED_SUBHEADING)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenLaunchedBannerSkeleton)).toBeNull()
  })

  it('claims a failed launch once the checkpoint proves the auction fell short', () => {
    const outcome = renderBanner({
      currencyRaised: RAISED_BELOW_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.FAILED)
    expect(screen.getByText(FAILED_HEADING)).toBeInTheDocument()
    expect(screen.getByText(FAILED_SUBHEADING)).toBeInTheDocument()
  })

  it('renders the launched banner for an oversubscribed auction', () => {
    const outcome = renderBanner({
      currencyRaised: RAISED_ABOVE_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
    })

    expect(outcome).toBe(AuctionOutcome.GRADUATED)
    // Positive assertion: absence of the failure strings alone would also hold if this rendered
    // the skeleton, which is what it did before the price hooks above were stubbed.
    expect(screen.getByText(LAUNCHED_COPY)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenLaunchedBannerSkeleton)).toBeNull()
    expectNoFailureClaim()
  })
})

describe('TokenLaunchedBanner redeemable token trading', () => {
  beforeEach(() => {
    vi.mocked(useAuctionRedemption).mockReturnValue({
      isRedeemable: true,
      realTokenAddress: CAP_ADDRESS,
      redeemUrl: 'https://redeem.caplabslimited.com/',
      chainId: UniverseChainId.Mainnet,
      loading: false,
    })
    // GraphQL reports zero for CAP's price and history despite existing underlying pools.
    vi.mocked(useTokenLaunchedBannerPriceData).mockReturnValue({
      data: undefined,
      loading: false,
      hasMarketPrice: false,
    })
  })

  function renderRedeemableBanner(isTradeAvailableFromStatus = true) {
    return renderBanner({
      currencyRaised: RAISED_ABOVE_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
      isTradeAvailableFromStatus,
      auctionDetails: { tokenAddress: RCAP_ADDRESS },
    })
  }

  it('offers trading when CAP has an underlying pool despite its zero GraphQL price', () => {
    vi.mocked(useTokenPoolState).mockReturnValue({
      poolState: { status: 'success', poolCount: 7 },
      refetch: vi.fn(),
    })
    renderRedeemableBanner()

    expect(screen.getByText('Trade now')).toBeInTheDocument()
    expect(screen.queryByText(LAUNCHED_COPY)).toBeNull()
    expect(useTokenPoolState).toHaveBeenCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: CAP_ADDRESS,
      enabled: true,
    })
  })

  it.each<TokenPoolState>([{ status: 'success', poolCount: 0 }, { status: 'error' }])(
    'does not offer trading without a confirmed underlying pool: %j',
    (poolState) => {
      vi.mocked(useTokenPoolState).mockReturnValue({ poolState, refetch: vi.fn() })
      renderRedeemableBanner()

      expect(screen.getByText(LAUNCHED_COPY)).toBeInTheDocument()
      expect(screen.queryByText('Trade now')).toBeNull()
    },
  )

  it('waits for the underlying pool lookup before deciding trading availability', () => {
    renderRedeemableBanner()

    expect(screen.getByTestId(TestID.TokenLaunchedBannerSkeleton)).toBeInTheDocument()
    expect(screen.queryByText('Trade now')).toBeNull()
  })

  it('does not wait indefinitely when the underlying address could not be resolved', () => {
    vi.mocked(useAuctionRedemption).mockReturnValue({
      isRedeemable: true,
      realTokenAddress: undefined,
      redeemUrl: 'https://redeem.caplabslimited.com/',
      chainId: UniverseChainId.Mainnet,
      loading: false,
    })
    renderRedeemableBanner()

    expect(screen.getByText(LAUNCHED_COPY)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenLaunchedBannerSkeleton)).toBeNull()
    expect(useTokenPoolState).toHaveBeenCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: undefined,
      enabled: false,
    })
  })

  it('still requires the auction status to permit trading', () => {
    vi.mocked(useTokenPoolState).mockReturnValue({
      poolState: { status: 'success', poolCount: 7 },
      refetch: vi.fn(),
    })
    renderRedeemableBanner(false)

    expect(screen.getByText(LAUNCHED_COPY)).toBeInTheDocument()
    expect(screen.queryByText('Trade now')).toBeNull()
  })
})

it('preserves ordinary auction trading without fetching underlying pools', () => {
  vi.mocked(useTokenLaunchedBannerPriceData).mockReturnValue({
    data: { priceSeries: [], currentTickValue: 1.23, changePercentage: 0 },
    loading: false,
    hasMarketPrice: true,
  })
  renderBanner({
    currencyRaised: RAISED_ABOVE_TARGET,
    checkpointLoadState: AuctionCheckpointLoadState.Success,
    isTradeAvailableFromStatus: true,
  })

  expect(screen.getByText('Trade now')).toBeInTheDocument()
  expect(useTokenPoolState).toHaveBeenCalledWith({
    chainId: UniverseChainId.Mainnet,
    tokenAddress: undefined,
    enabled: false,
  })
})

describe('TokenLaunchedBanner pressability', () => {
  it('is not a button while the token cannot be traded yet', () => {
    renderBanner({
      currencyRaised: RAISED_ABOVE_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
      isTradeAvailableFromStatus: false,
    })

    expect(screen.getByText(LAUNCHED_COPY)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('becomes a button once it leads to the token page', () => {
    vi.mocked(useTokenLaunchedBannerPriceData).mockReturnValue({
      data: { priceSeries: [], currentTickValue: 1.23, changePercentage: 0 },
      loading: false,
      hasMarketPrice: true,
    })
    renderBanner({
      currencyRaised: RAISED_ABOVE_TARGET,
      checkpointLoadState: AuctionCheckpointLoadState.Success,
      isTradeAvailableFromStatus: true,
    })

    // The banner itself plus the "Trade now" CTA it contains.
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByText('Trade now')).toBeInTheDocument()
  })
})

import { act, renderHook } from '@testing-library/react'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Q96 } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { useBidFormController } from '~/features/Toucan/Auction/hooks/useBidFormController'
import type { AuctionDetails } from '~/features/Toucan/Auction/store/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('ui/src', () => ({
  useSporeColors: () => ({ surface1: { val: '#FFFFFF' } }),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: () => '0x00000000000000000000000000000000000000ab',
  useConnectionStatus: () => ({ isConnecting: false }),
}))

const CHAIN_ID = 1
const BID_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001'
const AUCTION_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000002'
const BID_TOKEN = new Token(CHAIN_ID, BID_TOKEN_ADDRESS, 18, 'ETH', 'Ether')

const bidCurrencyInfo = {
  currency: BID_TOKEN,
  currencyId: `${CHAIN_ID}-${BID_TOKEN_ADDRESS}`,
  logoUrl: null,
} as CurrencyInfo

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: () => bidCurrencyInfo,
}))

vi.mock('uniswap/src/features/portfolio/api', () => ({
  useOnChainCurrencyBalance: () => ({
    balance: CurrencyAmount.fromRawAmount(BID_TOKEN, '10000000000000000000'),
  }),
}))

vi.mock('uniswap/src/features/transactions/hooks/useFiatTokenConversion', () => ({
  useFiatTokenConversion: () => ({
    usdPriceOfCurrency: undefined,
    fiatToToken: () => null,
    tokenToFiat: () => null,
  }),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: () => null,
}))

vi.mock('~/features/Toucan/Auction/hooks/useDurationRemaining', () => ({
  useDurationRemaining: () => undefined,
}))

// The controller reads the auction's bid price ceiling, which resolves through
// useVerifyWalletParams and therefore the accounts store context. Mutable so a test can make
// the ceiling ARRIVE after mount (the real VerifyWallet timing); the default is still
// "auction imposes no ceiling".
const mockMaxBidPriceState: {
  maxBidPriceQ96: bigint | undefined
  maxValidBidQ96: bigint | undefined
  isMaxBidPriceReached: boolean
} = {
  maxBidPriceQ96: undefined,
  maxValidBidQ96: undefined,
  isMaxBidPriceReached: false,
}

vi.mock('~/features/Toucan/Auction/hooks/useAuctionMaxBidPrice', () => ({
  useAuctionMaxBidPrice: () => ({
    maxBidPriceQ96: mockMaxBidPriceState.maxBidPriceQ96,
    maxValidBidQ96: mockMaxBidPriceState.maxValidBidQ96,
    maxBidPriceFdvFormatted: undefined,
    isMaxBidPriceReached: mockMaxBidPriceState.isMaxBidPriceReached,
  }),
}))

// Budget is a sibling field; a non-zero budget keeps the publish gate open so the tests
// isolate the hasUserSetMaxValuation condition. Mutable so a test can flip it from zero to
// non-zero mid-session, the way a budget keystroke does.
const mockBudgetState = { budgetAmountIsZero: false }

vi.mock('~/features/Toucan/Auction/hooks/useBidBudgetField', () => ({
  useBidBudgetField: () => ({
    budgetField: { currencyAmount: undefined, usdValue: null },
    budgetCurrencyAmount: undefined,
    budgetAmountIsZero: mockBudgetState.budgetAmountIsZero,
    resetBudgetField: vi.fn(),
  }),
}))

// Capture the submit hook's params so tests can drive the post-submit reset path
let capturedSubmitParams: { resetMaxValuationField: () => void } | undefined
vi.mock('~/features/Toucan/Auction/hooks/useBidFormSubmit', () => ({
  useBidFormSubmit: vi.fn((params: { resetMaxValuationField: () => void }) => {
    capturedSubmitParams = params
    return { submitState: {} }
  }),
}))

const mockSetUserBidPrice = vi.fn()
const mockSetSelectedTickPrice = vi.fn()

interface MockStoreState {
  auctionDetails: AuctionDetails | null
  auctionAddress: string | null
  checkpointData: null
  totalCleared: string | null
  selectedTickPrice: string | null
}

const mockStoreState: MockStoreState = {
  auctionDetails: null,
  auctionAddress: null,
  checkpointData: null,
  totalCleared: null,
  selectedTickPrice: null,
}

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: MockStoreState) => unknown) => selector(mockStoreState),
  useAuctionStoreActions: () => ({
    setUserBidPrice: mockSetUserBidPrice,
    setSelectedTickPrice: mockSetSelectedTickPrice,
  }),
}))

// Price grid: floor = clearing = 1.0, tick = 0.25 → min valid bid (default prefill) = 1.25
const FLOOR_PRICE_Q96 = Q96
const TICK_SIZE_Q96 = Q96 / 4n
const DEFAULT_PREFILL_DISPLAY = '1.25'

function buildAuctionDetails(): AuctionDetails {
  return {
    chainId: CHAIN_ID,
    currency: BID_TOKEN_ADDRESS,
    endBlock: '200',
    floorPrice: FLOOR_PRICE_Q96.toString(),
    clearingPrice: FLOOR_PRICE_Q96.toString(),
    tickSize: TICK_SIZE_Q96.toString(),
    totalSupply: (10n ** 27n).toString(),
    tokenAddress: AUCTION_TOKEN_ADDRESS,
    token: {
      currency: new Token(CHAIN_ID, AUCTION_TOKEN_ADDRESS, 18, 'TCAN', 'Toucan'),
      currencyId: `${CHAIN_ID}-${AUCTION_TOKEN_ADDRESS}`,
      logoUrl: null,
    } as CurrencyInfo,
  } as unknown as AuctionDetails
}

function publishedBidPrices(): (string | null)[] {
  return mockSetUserBidPrice.mock.calls.map(([value]) => value as string | null)
}

describe('useBidFormController — userBidPrice publish gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSubmitParams = undefined
    mockStoreState.auctionDetails = buildAuctionDetails()
    mockStoreState.auctionAddress = '0x0000000000000000000000000000000000000003'
    mockStoreState.checkpointData = null
    mockStoreState.totalCleared = null
    mockStoreState.selectedTickPrice = null
    mockMaxBidPriceState.maxBidPriceQ96 = undefined
    mockMaxBidPriceState.maxValidBidQ96 = undefined
    mockMaxBidPriceState.isMaxBidPriceReached = false
    mockBudgetState.budgetAmountIsZero = false
  })

  it('never publishes a userBidPrice from the default prefill alone', () => {
    const { result } = renderHook(() => useBidFormController({}))

    // The default prefill armed the field with a fully valid bid price...
    expect(result.current.maxValuationField.tokenValue).toBe(DEFAULT_PREFILL_DISPLAY)
    expect(result.current.maxPriceQ96).toBe(FLOOR_PRICE_Q96 + TICK_SIZE_Q96)
    // ...yet the pre-fix regression value was never published; every store update cleared the bid line
    expect(publishedBidPrices()).not.toContain('1.25')
    expect(publishedBidPrices().every((price) => price === null)).toBe(true)
  })

  it('publishes the snapped price once the user types a max valuation', () => {
    const { result } = renderHook(() => useBidFormController({}))

    act(() => {
      result.current.maxValuationField.onChange('2')
    })

    expect(mockSetUserBidPrice).toHaveBeenLastCalledWith('2')
  })

  it('publishes the snapped price after a slider drag', () => {
    const { result } = renderHook(() => useBidFormController({}))

    act(() => {
      result.current.maxValuationField.onTokenValueQ96Change(2n * Q96)
    })

    expect(mockSetUserBidPrice).toHaveBeenLastCalledWith('2')
  })

  it('publishes the tick price after a chart tick click', () => {
    mockStoreState.selectedTickPrice = '1.5'

    renderHook(() => useBidFormController({}))

    expect(mockSetUserBidPrice).toHaveBeenLastCalledWith('1.5')
    // The controller consumes the click so subsequent renders do not re-apply it
    expect(mockSetSelectedTickPrice).toHaveBeenCalledWith(null)
  })

  it('clears the published price when the field resets after a submitted bid', () => {
    const { result } = renderHook(() => useBidFormController({}))

    act(() => {
      result.current.maxValuationField.onChange('2')
    })
    expect(mockSetUserBidPrice).toHaveBeenLastCalledWith('2')

    act(() => {
      capturedSubmitParams?.resetMaxValuationField()
    })

    // Reset restores the default prefill, which must clear the bid line, not republish it
    expect(mockSetUserBidPrice).toHaveBeenLastCalledWith(null)
    expect(result.current.maxValuationField.tokenValue).toBe(DEFAULT_PREFILL_DISPLAY)
  })
})

describe('useBidFormController — late-arriving ceiling vs the untouched default prefill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.auctionDetails = buildAuctionDetails()
    mockStoreState.auctionAddress = '0x0000000000000000000000000000000000000003'
    mockStoreState.checkpointData = null
    mockStoreState.totalCleared = null
    mockStoreState.selectedTickPrice = null
    mockMaxBidPriceState.maxBidPriceQ96 = undefined
    mockMaxBidPriceState.maxValidBidQ96 = undefined
    mockMaxBidPriceState.isMaxBidPriceReached = false
    mockBudgetState.budgetAmountIsZero = true
  })

  it('does not publish a bid price when the ceiling resolves onto the default prefill and a budget then arrives', () => {
    // One legal tick left: the ceiling's tick === the min valid bid === the default prefill.
    // isMaxBidPriceReached is minValidBid > maxValidBid, so it is false at equality and the
    // form stays open.
    const CEILING_Q96 = FLOOR_PRICE_Q96 + TICK_SIZE_Q96

    const { result, rerender } = renderHook(() => useBidFormController({}))

    // Baseline: untouched default prefill, no ceiling yet, zero budget.
    expect(result.current.maxValuationField.tokenValue).toBe(DEFAULT_PREFILL_DISPLAY)
    expect(result.current.maxPriceQ96).toBe(CEILING_Q96)
    expect(publishedBidPrices().every((price) => price === null)).toBe(true)

    // The ceiling ARRIVES (VerifyWallet lands). This is the transition useCeilingRecap keys on.
    mockMaxBidPriceState.maxBidPriceQ96 = CEILING_Q96
    mockMaxBidPriceState.maxValidBidQ96 = CEILING_Q96
    rerender()

    const tokenValueQ96AtCeiling = result.current.maxValuationField.tokenValueQ96

    // A budget keystroke opens the last remaining clause of the publish gate.
    mockBudgetState.budgetAmountIsZero = false
    rerender()

    const published = publishedBidPrices()
    const lastPublished = published[published.length - 1]

    // The suspected trigger: the field's Q96 value overshooting the ceiling by a few units so
    // useCeilingRecap's strict `tokenValueQ96 > maxValidBidQ96` fires on the untouched default.
    // It does not — the decimal-string round trip is exact here, so the value lands ON the
    // ceiling, and the recap's comparison is strictly greater.
    expect({
      ceilingQ96: CEILING_Q96.toString(),
      tokenValueQ96AtCeiling: tokenValueQ96AtCeiling?.toString(),
      overshootOverCeiling: ((tokenValueQ96AtCeiling ?? 0n) - CEILING_Q96).toString(),
      recapWouldFire: (tokenValueQ96AtCeiling ?? 0n) > CEILING_Q96,
    }).toEqual({
      ceilingQ96: CEILING_Q96.toString(),
      tokenValueQ96AtCeiling: CEILING_Q96.toString(),
      overshootOverCeiling: '0',
      recapWouldFire: false,
    })

    // The field still shows the untouched default, and nothing was ever published: no phantom
    // "Your bid" indicator.
    expect(result.current.maxValuationField.tokenValue).toBe(DEFAULT_PREFILL_DISPLAY)
    expect(result.current.maxPriceQ96).toBe(CEILING_Q96)
    expect(lastPublished).toBeNull()
    expect(published.every((price) => price === null)).toBe(true)
  })

  // Same sequence, but on a tick grid whose min valid bid is NOT exactly representable as a
  // raw bid-token amount. floor = 1e-6 (Q96/1e6), tick = floor/97 — both arbitrary integers,
  // which is the normal on-chain case; the suite's default grid (floor = 2^96, tick = 2^94) is
  // the unrepresentative one, because its round trip is exact.
  it('does not publish a bid price when a ceiling recap fires on the untouched default', () => {
    const OVERSHOOT_FLOOR_Q96 = 79228162514264337593543n
    const OVERSHOOT_TICK_Q96 = 816785180559426160758n
    const OVERSHOOT_MIN_VALID_BID_Q96 = OVERSHOOT_FLOOR_Q96 + OVERSHOOT_TICK_Q96

    mockStoreState.auctionDetails = {
      ...buildAuctionDetails(),
      floorPrice: OVERSHOOT_FLOOR_Q96.toString(),
      clearingPrice: OVERSHOOT_FLOOR_Q96.toString(),
      tickSize: OVERSHOOT_TICK_Q96.toString(),
    }

    const { result, rerender } = renderHook(() => useBidFormController({}))

    expect(result.current.maxPriceQ96).toBe(OVERSHOOT_MIN_VALID_BID_Q96)
    expect(publishedBidPrices().every((price) => price === null)).toBe(true)

    // Ceiling arrives at the one-legal-tick-left equality case, exactly as in the test above.
    mockMaxBidPriceState.maxBidPriceQ96 = OVERSHOOT_MIN_VALID_BID_Q96
    mockMaxBidPriceState.maxValidBidQ96 = OVERSHOOT_MIN_VALID_BID_Q96
    rerender()

    const tokenValueQ96AtCeiling = result.current.maxValuationField.tokenValueQ96

    mockBudgetState.budgetAmountIsZero = false
    rerender()

    const published = publishedBidPrices()
    const lastPublished = published[published.length - 1]

    // The field's own Q96 lands ABOVE the ceiling purely from the decimal round trip, so
    // useCeilingRecap's strict comparison still fires — the scenario under test is intact.
    expect((tokenValueQ96AtCeiling ?? 0n) > OVERSHOOT_MIN_VALID_BID_Q96).toBe(true)

    // The recap writes through a path that does not claim user authorship, so no bid price is
    // published: no phantom "Your bid" indicator at a default prefill the user never chose.
    expect(published.every((price) => price === null)).toBe(true)
    expect(lastPublished).toBeNull()
  })
})

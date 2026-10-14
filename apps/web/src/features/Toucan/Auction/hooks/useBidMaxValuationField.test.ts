import { act, renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Q96, q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { useBidMaxValuationField } from '~/features/Toucan/Auction/hooks/useBidMaxValuationField'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(() => null),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUSDCValue: () => null,
}))

vi.mock('uniswap/src/features/transactions/hooks/useFiatTokenConversion', () => ({
  useFiatTokenConversion: () => ({
    tokenToFiat: () => '',
    fiatToToken: () => null,
    usdPriceOfCurrency: undefined,
  }),
}))

const DECIMALS = 18
const BID_TOKEN = new Token(1, '0x0000000000000000000000000000000000000001', DECIMALS, 'ETH', 'Ether')

function priceString(q96: bigint): string {
  return q96ToPriceString({ q96Value: q96, bidTokenDecimals: DECIMALS, auctionTokenDecimals: DECIMALS })
}

// Sepolia auction 0xA91986C3…: floor 1e-08/token, tick 1e-10/token, ceiling 1e-06/token.
const FLOOR = 792281625142643375900n
const TICK = 7922816251426433759n
const CEILING = 79228162514264337593543n
const TOP_TICK = FLOOR + TICK * 9900n

function renderField() {
  return renderHook(() =>
    useBidMaxValuationField({
      bidCurrency: BID_TOKEN,
      currencyBalance: undefined,
      currencyInfo: undefined,
      bidTokenDecimals: DECIMALS,
      auctionTokenDecimals: DECIMALS,
      bidTokenSymbol: 'ETH',
      clearingPriceQ96: FLOOR,
      floorPriceQ96: FLOOR,
      tickSizeQ96: TICK,
      minMaxPriceQ96: FLOOR + TICK,
      maxBidPriceQ96: CEILING,
      minValidPriceDisplay: priceString(FLOOR + TICK),
      minValidPriceDisplayFormatted: priceString(FLOOR + TICK),
      defaultMaxValuationDisplay: priceString(FLOOR + TICK),
    }),
  )
}

// Simpler price grid for the gating tests: floor = clearing = 1.0, tick = 0.25
// → min valid bid = 1.25 (first tick strictly above clearing).
const FLOOR_PRICE_Q96 = Q96
const CLEARING_PRICE_Q96 = Q96
const TICK_SIZE_Q96 = Q96 / 4n
const MIN_MAX_PRICE_Q96 = Q96 + Q96 / 4n
const DEFAULT_MAX_VALUATION_DISPLAY = '1.25'

function renderGatingField(overrides: Partial<Parameters<typeof useBidMaxValuationField>[0]> = {}) {
  return renderHook(() =>
    useBidMaxValuationField({
      bidCurrency: BID_TOKEN,
      currencyBalance: undefined,
      currencyInfo: null,
      bidTokenDecimals: DECIMALS,
      auctionTokenDecimals: DECIMALS,
      bidTokenSymbol: 'ETH',
      clearingPriceQ96: CLEARING_PRICE_Q96,
      floorPriceQ96: FLOOR_PRICE_Q96,
      tickSizeQ96: TICK_SIZE_Q96,
      minMaxPriceQ96: MIN_MAX_PRICE_Q96,
      minValidPriceDisplay: DEFAULT_MAX_VALUATION_DISPLAY,
      minValidPriceDisplayFormatted: DEFAULT_MAX_VALUATION_DISPLAY,
      defaultMaxValuationDisplay: DEFAULT_MAX_VALUATION_DISPLAY,
      ...overrides,
    }),
  )
}

describe('useBidMaxValuationField chart-tick writes', () => {
  it('caps a charted tick above the ceiling before it reaches the field', () => {
    // This path deliberately suppresses the next blur snap, so nothing downstream would
    // correct it: an uncapped write leaves the input showing an FDV that will not be bid.
    const { result } = renderField()

    act(() => result.current.maxValuationField.onTokenValueChange(priceString(TOP_TICK + TICK * 10n)))

    expect(result.current.maxValuationField.tokenValue).toBe(priceString(TOP_TICK))
    expect(result.current.maxValuationField.wasCappedToMax).toBe(true)
  })

  it('leaves a charted tick under the ceiling exactly as clicked', () => {
    const { result } = renderField()
    const clicked = priceString(FLOOR + TICK * 100n)

    act(() => result.current.maxValuationField.onTokenValueChange(clicked))

    expect(result.current.maxValuationField.tokenValue).toBe(clicked)
    expect(result.current.maxValuationField.wasCappedToMax).toBe(false)
  })

  it('keeps the cap and the hint across the blur that follows typing', () => {
    // Typed input reaches this same handler (BidMaxValuationInputV2.handleFdvChange ->
    // onTokenValueChange), and it suppresses the next blur snap — so blur early-returns and
    // cannot be what applies the cap or raises the hint. Both must survive it.
    const { result } = renderField()

    act(() => result.current.maxValuationField.onTokenValueChange(priceString(TOP_TICK + TICK * 10n)))
    act(() => result.current.maxValuationField.onBlur())

    expect(result.current.maxValuationField.tokenValue).toBe(priceString(TOP_TICK))
    expect(result.current.maxValuationField.wasCappedToMax).toBe(true)
  })

  it('leaves the highest legal tick alone rather than reporting it capped', () => {
    const { result } = renderField()

    act(() => result.current.maxValuationField.onTokenValueChange(priceString(TOP_TICK)))

    expect(result.current.maxValuationField.tokenValue).toBe(priceString(TOP_TICK))
    expect(result.current.maxValuationField.wasCappedToMax).toBe(false)
  })
})

describe('useBidMaxValuationField — hasUserSetMaxValuation gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not flag user input when the default value is prefilled on initialization', () => {
    const { result } = renderGatingField()

    // The default prefill populated the field...
    expect(result.current.exactMaxValuationAmount).toBe(DEFAULT_MAX_VALUATION_DISPLAY)
    expect(result.current.maxPriceQ96).toBe(MIN_MAX_PRICE_Q96)
    // ...but it must not count as user input
    expect(result.current.hasUserSetMaxValuation).toBe(false)
  })

  it('flags user input when the user types into the field (onChange)', () => {
    const { result } = renderGatingField()

    act(() => {
      result.current.maxValuationField.onChange('2')
    })

    expect(result.current.hasUserSetMaxValuation).toBe(true)
    expect(result.current.exactMaxValuationAmount).toBe('2')
  })

  it('flags user input on chart tick click (onTokenValueChange)', () => {
    const { result } = renderGatingField()

    act(() => {
      result.current.maxValuationField.onTokenValueChange('1.5')
    })

    expect(result.current.hasUserSetMaxValuation).toBe(true)
    expect(result.current.exactMaxValuationAmount).toBe('1.5')
  })

  it('flags user input on slider drag (onTokenValueQ96Change)', () => {
    const { result } = renderGatingField()

    act(() => {
      result.current.maxValuationField.onTokenValueQ96Change(2n * Q96)
    })

    expect(result.current.hasUserSetMaxValuation).toBe(true)
    expect(result.current.exactMaxValuationAmount).toBe('2')
  })

  it('does not flag user input when a slider change is ignored for missing decimals', () => {
    const { result } = renderGatingField({ bidTokenDecimals: undefined })

    act(() => {
      result.current.maxValuationField.onTokenValueQ96Change(2n * Q96)
    })

    // The handler bails before registering the interaction
    expect(result.current.hasUserSetMaxValuation).toBe(false)
  })

  it('clears the flag and restores the default when the field is reset', () => {
    const { result } = renderGatingField()

    act(() => {
      result.current.maxValuationField.onChange('2')
    })
    expect(result.current.hasUserSetMaxValuation).toBe(true)

    act(() => {
      result.current.resetMaxValuationField()
    })

    expect(result.current.hasUserSetMaxValuation).toBe(false)
    expect(result.current.exactMaxValuationAmount).toBe(DEFAULT_MAX_VALUATION_DISPLAY)
  })
})

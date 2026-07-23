import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { getLaunchThreshold, quoteRaiseAtFloor } from '~/pages/Liquidity/CreateAuction/launchThreshold'
import { minimumAuctionSupplyDeposit } from '~/pages/Liquidity/CreateAuction/store/postAuctionLiquidityAllocationState'
import {
  CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
  MAX_CUSTOM_PRICE_RANGE_ENTRIES,
  type PostAuctionLiquidityAllocation,
  PostAuctionLiquidityAllocationType,
  RaiseCurrency,
  UNBOUNDED_TIER_ID,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  addCustomPriceRangePreset,
  amountToPercent,
  createDefaultCustomPriceRangeEntry,
  createNextBoundedTier,
  expandCompactNumberInput,
  formatCompactNumberDisplay,
  formatCompactNumberInput,
  getMaxTieredPostAuctionLiquidityEffectivePercent,
  getPostAuctionLiquidityPreviewPercent,
  getPostAuctionLiquidityTierLpDollars,
  getPrimaryStablecoin,
  getRaiseCurrencyAddress,
  getRaiseCurrencyAsCurrency,
  inputExceedsCurrencyPrecision,
  isCustomPriceRangeAllocationValid,
  isCustomPriceRangeEntryValid,
  isValidPartialPercentInput,
  parseCompactNumberInput,
  isValidPartialSignedPercentInput,
  percentOfSoldToLiquidityFromDepositAndLiquidityAmount,
  postAuctionLiquidityTokenAmountFromDepositedAndUiPercent,
  removeCustomPriceRangeEntry,
  updateCustomPriceRangeLiquidityPercent,
} from '~/pages/Liquidity/CreateAuction/utils'

const TEST_TOKEN = new Token(1, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap')
const single = (percent: number): PostAuctionLiquidityAllocation => ({
  type: PostAuctionLiquidityAllocationType.SINGLE,
  percent,
})

/** Whole `TEST_TOKEN` units as a CurrencyAmount (TEST_TOKEN has 18 decimals). */
const auctionTokens = (whole: number): CurrencyAmount<Token> =>
  CurrencyAmount.fromRawAmount(TEST_TOKEN, (BigInt(whole) * 10n ** BigInt(TEST_TOKEN.decimals)).toString())

describe('formatCompactNumberInput', () => {
  it('uses the next suffix when rounding would show 1000 of the smaller unit', () => {
    expect(formatCompactNumberInput(999_999)).toBe('1m')
    expect(formatCompactNumberDisplay(999_999)).toBe('1M')
  })

  it('keeps k when the normalized value stays below 1000 after rounding', () => {
    expect(formatCompactNumberInput(999_500)).toBe('999.5k')
  })

  it('avoids raw double tails for values below 1k (tier milestones / USD round-trips)', () => {
    const formatted = formatCompactNumberInput(333.3333333333333)
    expect(formatted).not.toMatch(/333\.3333333333333/)
    expect(formatted.length).toBeLessThan(20)
  })

  it('preserves fractional mantissas for compact billions (display precision)', () => {
    expect(formatCompactNumberInput(2_345_678_912)).toBe('2.35b')
    expect(formatCompactNumberDisplay(2_345_678_912)).toBe('2.35B')
    expect(formatCompactNumberInput(5_500_000_000_000)).toBe('5.5t')
    expect(formatCompactNumberDisplay(5_500_000_000_000)).toBe('5.5T')
  })
})

describe('isValidPartialPercentInput', () => {
  it('allows empty string', () => {
    expect(isValidPartialPercentInput('')).toBe(true)
  })

  it('allows integer strings', () => {
    expect(isValidPartialPercentInput('25')).toBe(true)
  })

  it('allows partial decimal entry', () => {
    expect(isValidPartialPercentInput('12.')).toBe(true)
    expect(isValidPartialPercentInput('.5')).toBe(true)
  })

  it('rejects more than five fractional digits', () => {
    expect(isValidPartialPercentInput('1.123456')).toBe(false)
  })

  it('rejects multiple dots', () => {
    expect(isValidPartialPercentInput('1.2.3')).toBe(false)
  })
})

describe('isValidPartialSignedPercentInput', () => {
  it('allows signed partial values', () => {
    expect(isValidPartialSignedPercentInput('-')).toBe(true)
    expect(isValidPartialSignedPercentInput('+')).toBe(true)
    expect(isValidPartialSignedPercentInput('-12.5')).toBe(true)
    expect(isValidPartialSignedPercentInput('+25')).toBe(true)
  })

  it('rejects invalid signed values', () => {
    expect(isValidPartialSignedPercentInput('--1')).toBe(false)
    expect(isValidPartialSignedPercentInput('1.2.3')).toBe(false)
    expect(isValidPartialSignedPercentInput('1.123456')).toBe(false)
  })
})

describe('custom price range utilities', () => {
  it('creates the default full-range row', () => {
    expect(createDefaultCustomPriceRangeEntry()).toEqual({
      id: 'custom-range-1',
      liquidityPercent: 100,
      minPercentFromClearing: -100,
      maxPercentFromClearing: CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
    })
  })

  it('adds presets with remaining percent', () => {
    const entries = addCustomPriceRangePreset([createDefaultCustomPriceRangeEntry()], {
      minPercentFromClearing: -50,
      maxPercentFromClearing: 100,
    })

    expect(entries).toHaveLength(2)
    expect(entries[1]).toMatchObject({
      id: 'custom-range-2',
      liquidityPercent: 0,
      minPercentFromClearing: -50,
      maxPercentFromClearing: 100,
    })
  })

  it('limits custom ranges to ten entries', () => {
    const entries = Array.from({ length: MAX_CUSTOM_PRICE_RANGE_ENTRIES }, (_, index) => ({
      id: `custom-range-${index + 1}`,
      liquidityPercent: index === 0 ? 100 : 0,
      minPercentFromClearing: -index,
      maxPercentFromClearing: index + 1,
    }))

    expect(
      addCustomPriceRangePreset(entries, {
        minPercentFromClearing: -50,
        maxPercentFromClearing: 100,
      }),
    ).toBe(entries)
  })

  it('updates only the edited row and leaves other rows unchanged', () => {
    const entries = [
      createDefaultCustomPriceRangeEntry(),
      { id: 'custom-range-2', liquidityPercent: 0, minPercentFromClearing: -50, maxPercentFromClearing: 100 },
      { id: 'custom-range-3', liquidityPercent: 0, minPercentFromClearing: -33, maxPercentFromClearing: 50 },
    ]

    expect(
      updateCustomPriceRangeLiquidityPercent({
        entries,
        entryId: 'custom-range-2',
        percent: 25,
      }).map((entry) => entry.liquidityPercent),
    ).toEqual([100, 25, 0])
  })

  it('clamps the edited row percent into [0, 100] without touching other rows', () => {
    const entries = [
      { id: 'custom-range-1', liquidityPercent: 50, minPercentFromClearing: -50, maxPercentFromClearing: 100 },
      { id: 'custom-range-2', liquidityPercent: 50, minPercentFromClearing: -33, maxPercentFromClearing: 50 },
    ]

    expect(
      updateCustomPriceRangeLiquidityPercent({
        entries,
        entryId: 'custom-range-1',
        percent: 150,
      }).map((entry) => entry.liquidityPercent),
    ).toEqual([100, 50])

    expect(
      updateCustomPriceRangeLiquidityPercent({
        entries,
        entryId: 'custom-range-1',
        percent: -25,
      }).map((entry) => entry.liquidityPercent),
    ).toEqual([0, 50])
  })

  it('transfers removed row percent to the last remaining row', () => {
    const entries = [
      { id: 'custom-range-1', liquidityPercent: 25, minPercentFromClearing: -50, maxPercentFromClearing: 100 },
      { id: 'custom-range-2', liquidityPercent: 35, minPercentFromClearing: -33, maxPercentFromClearing: 50 },
      { id: 'custom-range-3', liquidityPercent: 40, minPercentFromClearing: -20, maxPercentFromClearing: 25 },
    ]

    expect(removeCustomPriceRangeEntry(entries, 'custom-range-2').map((entry) => entry.liquidityPercent)).toEqual([
      25, 75,
    ])
  })

  it('validates finite and infinite bounds', () => {
    expect(isCustomPriceRangeEntryValid(createDefaultCustomPriceRangeEntry())).toBe(true)
    expect(
      isCustomPriceRangeEntryValid({
        id: 'custom-range-1',
        liquidityPercent: 100,
        minPercentFromClearing: 10,
        maxPercentFromClearing: 10,
      }),
    ).toBe(false)
    expect(
      isCustomPriceRangeEntryValid({
        id: 'custom-range-1',
        liquidityPercent: 100,
        minPercentFromClearing: CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
        maxPercentFromClearing: 10,
      }),
    ).toBe(false)
    expect(
      isCustomPriceRangeEntryValid({
        id: 'custom-range-1',
        liquidityPercent: 100,
        minPercentFromClearing: -200,
        maxPercentFromClearing: 100,
      }),
    ).toBe(false)
    expect(
      isCustomPriceRangeEntryValid({
        id: 'custom-range-1',
        liquidityPercent: 100,
        minPercentFromClearing: -10,
        maxPercentFromClearing: -5,
      }),
    ).toBe(false)
  })

  it('requires custom range totals to equal 100', () => {
    expect(isCustomPriceRangeAllocationValid([createDefaultCustomPriceRangeEntry()])).toBe(true)
    expect(
      isCustomPriceRangeAllocationValid([
        { id: 'custom-range-1', liquidityPercent: 50, minPercentFromClearing: -50, maxPercentFromClearing: 100 },
      ]),
    ).toBe(false)
  })
})

describe('getPostAuctionLiquidityTierLpDollars', () => {
  it('computes LP dollars for the first tier (no previous milestone)', () => {
    expect(getPostAuctionLiquidityTierLpDollars({ raiseMilestone: '1m', percent: 50 })).toBe(500_000)
  })

  it('computes LP dollars using the marginal range when previousMilestone is provided', () => {
    // Tier range is 1M to 10M = 9M, at 25% → 2.25M
    expect(getPostAuctionLiquidityTierLpDollars({ raiseMilestone: '10m', percent: 25 }, 1_000_000)).toBe(2_250_000)
  })

  it('returns 0 when tier range is non-positive', () => {
    expect(getPostAuctionLiquidityTierLpDollars({ raiseMilestone: '1m', percent: 50 }, 2_000_000)).toBe(0)
  })
})

describe('getMaxTieredPostAuctionLiquidityEffectivePercent', () => {
  it('returns the tier percent for a single-tier allocation', () => {
    const result = getMaxTieredPostAuctionLiquidityEffectivePercent({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [{ id: 'tier-1', raiseMilestone: '1m', percent: 50 }],
    })
    expect(result).toBe(50)
  })

  it('returns the first tier percent for decreasing tiers (max is at tier 1 boundary)', () => {
    // Tier 1: ≤$1M at 50% → lpAccum=500k, r_eff=500k/1M=50%
    // Tier 2: ≤$100M at 25% → lpAccum=500k+24.75M=25.25M, r_eff=25.25M/100M=25.25%
    // Max effective percent = 50% (at tier 1)
    const result = getMaxTieredPostAuctionLiquidityEffectivePercent({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '1m', percent: 50 },
        { id: 'tier-2', raiseMilestone: '100m', percent: 25 },
      ],
    })
    expect(result).toBe(50)
  })

  it('returns the last tier effective percent for increasing tiers (max is at last boundary)', () => {
    // Tier 1: ≤$1M at 25% → lpAccum=250k, r_eff=250k/1M=25%
    // Tier 2: ≤$10M at 50% → lpAccum=250k+4.5M=4.75M, r_eff=4.75M/10M=47.5%
    // Max effective percent = 47.5% (at tier 2)
    const result = getMaxTieredPostAuctionLiquidityEffectivePercent({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '1m', percent: 25 },
        { id: 'tier-2', raiseMilestone: '10m', percent: 50 },
      ],
    })
    expect(result).toBeCloseTo(47.5)
  })

  it('handles three tiers with decreasing percentages', () => {
    // Tier 1: ≤$1M at 60% → lpAccum=600k, r_eff=60%
    // Tier 2: ≤$10M at 40% → lpAccum=600k+3.6M=4.2M, r_eff=42%
    // Tier 3: ≤$50M at 20% in UI (clamped to 25%) → lpAccum=4.2M+10M=14.2M, r_eff=28.4%
    // Max = 60% at tier 1
    const result = getMaxTieredPostAuctionLiquidityEffectivePercent({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '1m', percent: 60 },
        { id: 'tier-2', raiseMilestone: '10m', percent: 40 },
        { id: 'tier-3', raiseMilestone: '50m', percent: 20 },
      ],
    })
    expect(result).toBe(60)
  })

  it('uses the unbounded tier percent as a candidate for the max', () => {
    // Only unbounded tier at 50% → max effective = 50%
    const result = getMaxTieredPostAuctionLiquidityEffectivePercent({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [{ id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 50 }],
    })
    expect(result).toBe(50)
  })

  it('picks bounded tier boundary over unbounded when bounded has higher effective rate', () => {
    // Tier 1: ≤$1M at 50% → r_eff=50%
    // Unbounded at 25% → asymptotic r_eff=25%
    // Max = 50% at tier 1
    const result = getMaxTieredPostAuctionLiquidityEffectivePercent({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '1m', percent: 50 },
        { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 25 },
      ],
    })
    expect(result).toBe(50)
  })

  it('picks unbounded tier when it has the highest effective rate', () => {
    // Tier 1: ≤$1M at 25% → r_eff=25%
    // Unbounded at 100% → asymptotic r_eff=100%
    // Max = 100% (unbounded)
    const result = getMaxTieredPostAuctionLiquidityEffectivePercent({
      type: PostAuctionLiquidityAllocationType.TIERED,
      tiers: [
        { id: 'tier-1', raiseMilestone: '1m', percent: 25 },
        { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 100 },
      ],
    })
    expect(result).toBe(100)
  })
})

describe('getPostAuctionLiquidityPreviewPercent', () => {
  it('returns the single allocation percent for single type', () => {
    expect(
      getPostAuctionLiquidityPreviewPercent({
        type: PostAuctionLiquidityAllocationType.SINGLE,
        percent: 40,
      }),
    ).toBe(40)
  })

  it('returns the max effective percent for tiered allocation', () => {
    // Decreasing tiers: max effective is at tier 1 = 50%
    expect(
      getPostAuctionLiquidityPreviewPercent({
        type: PostAuctionLiquidityAllocationType.TIERED,
        tiers: [
          { id: 'tier-1', raiseMilestone: '1m', percent: 50 },
          { id: 'tier-2', raiseMilestone: '100m', percent: 25 },
        ],
      }),
    ).toBe(50)
  })

  it('floors sub-minimum tier percents when computing the tiered preview percent', () => {
    expect(
      getPostAuctionLiquidityPreviewPercent({
        type: PostAuctionLiquidityAllocationType.TIERED,
        tiers: [
          { id: 'tier-1', raiseMilestone: '1m', percent: 0 },
          { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 0 },
        ],
      }),
    ).toBe(25)
  })

  it('clamps sub-minimum effective tiered rate up to the UI minimum', () => {
    expect(
      getPostAuctionLiquidityPreviewPercent({
        type: PostAuctionLiquidityAllocationType.TIERED,
        tiers: [{ id: 'tier-1', raiseMilestone: '1m', percent: 10 }],
      }),
    ).toBe(25)
  })
})

describe('createNextBoundedTier', () => {
  it('uses the default milestone and tier-1 when only an unbounded tier exists', () => {
    const next = createNextBoundedTier([{ id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 30 }])
    expect(next).toMatchObject({ id: 'tier-1', raiseMilestone: '100k', percent: 30 })
  })

  it('uses 10× the last bounded milestone and the next numeric id', () => {
    const next = createNextBoundedTier([
      { id: 'tier-1', raiseMilestone: '1m', percent: 20 },
      { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 20 },
    ])
    expect(next).toMatchObject({ id: 'tier-2', raiseMilestone: '10m', percent: 25 })
  })

  it('picks the next id from the max existing tier-N suffix', () => {
    const next = createNextBoundedTier([
      { id: 'tier-1', raiseMilestone: '1m', percent: 15 },
      { id: 'tier-3', raiseMilestone: '10m', percent: 15 },
      { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 15 },
    ])
    expect(next.id).toBe('tier-4')
  })

  it('defaults the first bounded tier in raise units from USD when usdPriceNum is set', () => {
    const next = createNextBoundedTier([{ id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 50 }], {
      usdPriceNum: 3000,
    })
    expect(parseCompactNumberInput(next.raiseMilestone)).toBeCloseTo(100_000 / 3000, 5)
  })

  it('snaps default next tier to a whole-USD 10× boundary when usdPriceNum is set', () => {
    const usd = 3000
    const first = createNextBoundedTier([{ id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 100 }], {
      usdPriceNum: usd,
    })
    const second = createNextBoundedTier(
      [
        { ...first, id: 'tier-1' },
        { id: UNBOUNDED_TIER_ID, raiseMilestone: '', percent: 100 },
      ],
      { usdPriceNum: usd },
    )
    const firstRaise = parseCompactNumberInput(first.raiseMilestone) ?? 0
    const nextUsd = Math.round(firstRaise * usd * 10)
    expect(nextUsd).toBe(1_000_000)
    const secondRaise = parseCompactNumberInput(second.raiseMilestone) ?? 0
    expect(Math.abs(secondRaise - 1_000_000 / usd)).toBeLessThan(1e-6)
    expect(second.raiseMilestone).not.toMatch(/\.\d{10}/)
  })
})

describe('expandCompactNumberInput', () => {
  it('expands compact suffixes with fractional parts', () => {
    expect(expandCompactNumberInput('3.33b')).toBe('3330000000')
    expect(expandCompactNumberInput('1.5m')).toBe('1500000')
  })

  it('expands whole-number compact values', () => {
    expect(expandCompactNumberInput('500k')).toBe('500000')
    expect(expandCompactNumberInput('2t')).toBe('2000000000000')
  })

  it('returns plain digit strings when there is no suffix', () => {
    expect(expandCompactNumberInput('42')).toBe('42')
    expect(expandCompactNumberInput('3.14')).toBe('3.14')
  })

  it('returns null for empty or invalid input', () => {
    expect(expandCompactNumberInput('')).toBeNull()
    expect(expandCompactNumberInput('   ')).toBeNull()
    expect(expandCompactNumberInput('1.2.3k')).toBeNull()
    expect(expandCompactNumberInput('abc')).toBeNull()
    expect(expandCompactNumberInput('k')).toBeNull()
  })

  it('is case-insensitive for suffix letters', () => {
    expect(expandCompactNumberInput('1M')).toBe('1000000')
    expect(expandCompactNumberInput('1B')).toBe('1000000000')
  })
})

describe('inputExceedsCurrencyPrecision', () => {
  it('rejects values with more fractional digits than the currency supports', () => {
    // ETH (18 decimals): 0.<19 zeros>1 carries 19 fractional digits
    expect(inputExceedsCurrencyPrecision('0.0000000000000000001', 18)).toBe(true)
    // USDC (6 decimals): 0.0000001 carries 7 fractional digits
    expect(inputExceedsCurrencyPrecision('0.0000001', 6)).toBe(true)
  })

  it('accepts values exactly at the currency precision', () => {
    // 18 zeros + 1 → 18 fractional digits, exactly the wei boundary
    expect(inputExceedsCurrencyPrecision('0.000000000000000001', 18)).toBe(false)
    expect(inputExceedsCurrencyPrecision('0.000001', 6)).toBe(false)
  })

  it('accepts whole numbers and short decimals', () => {
    expect(inputExceedsCurrencyPrecision('100', 18)).toBe(false)
    expect(inputExceedsCurrencyPrecision('0.5', 18)).toBe(false)
    expect(inputExceedsCurrencyPrecision('1.234', 6)).toBe(false)
  })

  it('treats intermediate / suffix-only inputs as in-range', () => {
    expect(inputExceedsCurrencyPrecision('', 18)).toBe(false)
    expect(inputExceedsCurrencyPrecision('0.', 18)).toBe(false)
    expect(inputExceedsCurrencyPrecision('k', 18)).toBe(false)
  })

  it('applies the cap to the post-suffix-expansion value', () => {
    // 0.001k = 1 (suffix shifts the decimal) — no fractional digits after expansion
    expect(inputExceedsCurrencyPrecision('0.001k', 0)).toBe(false)
    // 0.0001m = 100 — still no fractional digits
    expect(inputExceedsCurrencyPrecision('0.0001m', 0)).toBe(false)
    // 0.1234567k → 123.4567 → 4 fractional digits → exceeds 3-decimal currency
    expect(inputExceedsCurrencyPrecision('0.1234567k', 3)).toBe(true)
  })

  it('rejects any decimal input on a zero-decimal currency', () => {
    expect(inputExceedsCurrencyPrecision('1.5', 0)).toBe(true)
    expect(inputExceedsCurrencyPrecision('1', 0)).toBe(false)
  })
})

describe('amountToPercent', () => {
  it('computes the percentage for whole-unit amounts', () => {
    const total = CurrencyAmount.fromRawAmount(TEST_TOKEN, 5)
    const part = CurrencyAmount.fromRawAmount(TEST_TOKEN, 3)
    expect(amountToPercent(total, part)).toBe(60)
  })

  it('returns 0 when the total is exactly zero', () => {
    const zero = CurrencyAmount.fromRawAmount(TEST_TOKEN, 0)
    const part = CurrencyAmount.fromRawAmount(TEST_TOKEN, 1)
    expect(amountToPercent(zero, part)).toBe(0)
  })

  // Regression: a sub-unit total (e.g. half a base unit from an LP split) floors to 0 base
  // units. Dividing the floored integers would be a divide-by-zero; the exact-fraction path
  // must survive it.
  it('does not divide by zero for sub-unit amounts', () => {
    const halfUnit = postAuctionLiquidityTokenAmountFromDepositedAndUiPercent(
      CurrencyAmount.fromRawAmount(TEST_TOKEN, 1),
      100,
    ) // 0.5 base units
    expect(() => amountToPercent(halfUnit, halfUnit)).not.toThrow()
    expect(amountToPercent(halfUnit, halfUnit)).toBe(100)
  })
})

describe('percentOfSoldToLiquidityFromDepositAndLiquidityAmount', () => {
  // Reproduces the crash: a 1-base-unit deposit at 100% LP splits into a 0.5-unit reserve and a
  // 0.5-unit sold leg; deriving the slider percent from those must not throw.
  it('does not crash when the deposit is a single base unit', () => {
    const deposit = CurrencyAmount.fromRawAmount(TEST_TOKEN, 1)
    const reserve = postAuctionLiquidityTokenAmountFromDepositedAndUiPercent(deposit, 100)
    expect(() => percentOfSoldToLiquidityFromDepositAndLiquidityAmount(deposit, reserve)).not.toThrow()
    expect(percentOfSoldToLiquidityFromDepositAndLiquidityAmount(deposit, reserve)).toBe(100)
  })
})

describe('minimumAuctionSupplyDeposit', () => {
  it('requires 2 base units at a 100% LP allocation (reserve and sold each floor to 1)', () => {
    expect(minimumAuctionSupplyDeposit(TEST_TOKEN, single(100)).quotient.toString()).toBe('2')
  })

  it('scales the minimum up as the LP percent shrinks', () => {
    expect(minimumAuctionSupplyDeposit(TEST_TOKEN, single(50)).quotient.toString()).toBe('3')
    expect(minimumAuctionSupplyDeposit(TEST_TOKEN, single(25)).quotient.toString()).toBe('5')
    expect(minimumAuctionSupplyDeposit(TEST_TOKEN, single(10)).quotient.toString()).toBe('11')
  })

  it('keeps both the LP reserve and sold legs at >= 1 base unit at the minimum', () => {
    const allocation = single(25)
    const min = minimumAuctionSupplyDeposit(TEST_TOKEN, allocation)
    const reserve = postAuctionLiquidityTokenAmountFromDepositedAndUiPercent(min, 25)
    expect(reserve.quotient.toString()).toBe('1')
    expect(min.subtract(reserve).quotient.toString()).toBe('4')
  })

  it('falls back to a single base unit when there is no LP reserve', () => {
    expect(minimumAuctionSupplyDeposit(TEST_TOKEN, single(0)).quotient.toString()).toBe('1')
  })
})

describe('quoteRaiseAtFloor', () => {
  it('multiplies the floor price by the token amount, in the raise currency', () => {
    // 0.1 USDC/token × 50M tokens = 5M USDC
    const result = quoteRaiseAtFloor({
      floorPrice: '0.1',
      raiseCurrency: RaiseCurrency.STABLECOIN,
      chainId: UniverseChainId.Mainnet,
      tokensAmount: auctionTokens(50_000_000),
    })
    expect(result?.currency.symbol).toBe('USDC')
    expect(result?.toExact()).toBe('5000000')
  })

  it('returns undefined for an empty floor price', () => {
    expect(
      quoteRaiseAtFloor({
        floorPrice: '',
        raiseCurrency: RaiseCurrency.STABLECOIN,
        chainId: UniverseChainId.Mainnet,
        tokensAmount: auctionTokens(50_000_000),
      }),
    ).toBeUndefined()
  })

  it('returns undefined when the token amount is zero', () => {
    expect(
      quoteRaiseAtFloor({
        floorPrice: '0.1',
        raiseCurrency: RaiseCurrency.STABLECOIN,
        chainId: UniverseChainId.Mainnet,
        tokensAmount: auctionTokens(0),
      }),
    ).toBeUndefined()
  })
})

describe('getLaunchThreshold', () => {
  it('is floor price × tokens sold (deposit − LP reserve), in the raise currency', () => {
    // 100M deposit − 25M reserved for LP = 75M sold; 0.1 USDC floor → 7.5M USDC
    const result = getLaunchThreshold({
      floorPrice: '0.1',
      raiseCurrency: RaiseCurrency.STABLECOIN,
      chainId: UniverseChainId.Mainnet,
      auctionSupplyAmount: auctionTokens(100_000_000),
      postAuctionLiquidityAmount: auctionTokens(25_000_000),
    })
    expect(result?.currency.symbol).toBe('USDC')
    expect(result?.toExact()).toBe('7500000')
  })

  it('rises when fewer tokens are reserved for the LP (more tokens sold)', () => {
    const base = {
      floorPrice: '0.1',
      raiseCurrency: RaiseCurrency.STABLECOIN,
      chainId: UniverseChainId.Mainnet,
      auctionSupplyAmount: auctionTokens(100_000_000),
    }
    const higherLpReserve = getLaunchThreshold({ ...base, postAuctionLiquidityAmount: auctionTokens(40_000_000) }) // 20M sold
    const lowerLpReserve = getLaunchThreshold({ ...base, postAuctionLiquidityAmount: auctionTokens(10_000_000) }) // 80M sold
    expect(Number(lowerLpReserve?.toExact())).toBeGreaterThan(Number(higherLpReserve?.toExact()))
  })

  it('supports ETH as the raise currency', () => {
    // 0.001 ETH/token × 75M sold = 75,000 ETH
    const result = getLaunchThreshold({
      floorPrice: '0.001',
      raiseCurrency: RaiseCurrency.NATIVE,
      chainId: UniverseChainId.Mainnet,
      auctionSupplyAmount: auctionTokens(100_000_000),
      postAuctionLiquidityAmount: auctionTokens(25_000_000),
    })
    expect(result?.currency.isNative).toBe(true)
    expect(result?.toExact()).toBe('75000')
  })

  it('returns undefined when the floor price is empty', () => {
    expect(
      getLaunchThreshold({
        floorPrice: '',
        raiseCurrency: RaiseCurrency.STABLECOIN,
        chainId: UniverseChainId.Mainnet,
        auctionSupplyAmount: auctionTokens(100_000_000),
        postAuctionLiquidityAmount: auctionTokens(25_000_000),
      }),
    ).toBeUndefined()
  })

  it('returns undefined when no tokens are sold (all supply reserved)', () => {
    expect(
      getLaunchThreshold({
        floorPrice: '0.1',
        raiseCurrency: RaiseCurrency.STABLECOIN,
        chainId: UniverseChainId.Mainnet,
        auctionSupplyAmount: auctionTokens(25_000_000),
        postAuctionLiquidityAmount: auctionTokens(25_000_000),
      }),
    ).toBeUndefined()
  })
})

describe('getPrimaryStablecoin', () => {
  it('returns each chain’s curated primary stablecoin, not a hardcoded USDC', () => {
    expect(getPrimaryStablecoin(UniverseChainId.Mainnet).symbol).toBe('USDC')
    expect(getPrimaryStablecoin(UniverseChainId.Robinhood).symbol).toBe('USDG')
    expect(getPrimaryStablecoin(UniverseChainId.XLayer).symbol).toBe('USDT0')
  })
})

describe('getRaiseCurrencyAsCurrency', () => {
  it('resolves the ETH slot to the chain’s native currency (ETH/AVAX/OKB), not literal ETH', () => {
    expect(getRaiseCurrencyAsCurrency(RaiseCurrency.NATIVE, UniverseChainId.Mainnet)?.symbol).toBe('ETH')
    expect(getRaiseCurrencyAsCurrency(RaiseCurrency.NATIVE, UniverseChainId.Avalanche)?.symbol).toBe('AVAX')
    expect(getRaiseCurrencyAsCurrency(RaiseCurrency.NATIVE, UniverseChainId.XLayer)?.symbol).toBe('OKB')
  })

  it('resolves the stablecoin slot to the chain’s primary stablecoin', () => {
    expect(getRaiseCurrencyAsCurrency(RaiseCurrency.STABLECOIN, UniverseChainId.Mainnet)?.symbol).toBe('USDC')
    expect(getRaiseCurrencyAsCurrency(RaiseCurrency.STABLECOIN, UniverseChainId.Robinhood)?.symbol).toBe('USDG')
    expect(getRaiseCurrencyAsCurrency(RaiseCurrency.STABLECOIN, UniverseChainId.XLayer)?.symbol).toBe('USDT0')
  })
})

describe('getRaiseCurrencyAddress', () => {
  it('returns the zero address for the native slot and the primary stablecoin address otherwise', () => {
    expect(getRaiseCurrencyAddress(RaiseCurrency.NATIVE, UniverseChainId.Mainnet)).toBe(
      '0x0000000000000000000000000000000000000000',
    )
    expect(getRaiseCurrencyAddress(RaiseCurrency.STABLECOIN, UniverseChainId.Robinhood)).toBe(
      '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
    )
  })
})

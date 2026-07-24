import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DYNAMIC_FEE_DATA } from 'uniswap/src/features/positions/types'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'
import {
  getCreateFeeTierOptions,
  getCreateFeeTierSearchData,
  getSteeredRecommendedFee,
} from '~/features/Liquidity/utils/createFeeTiers'
import { calculateTickSpacingFromFeeAmount, getFeeTierKey } from '~/features/Liquidity/utils/feeTiers'
import { FeeTierData } from '~/types/liquidity'

const formatPercent = (percent: string | number | undefined, _maxDecimals?: PercentNumberDecimals) =>
  `${Number(percent) * 100}%`

const keyOf = (feeAmount: number, isDynamic = false) =>
  getFeeTierKey({
    feeTier: feeAmount,
    tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount, OFF),
    isDynamicFee: isDynamic,
  })

const tierData = (
  feeAmount: number,
  tvl: string,
  opts: { isDynamic?: boolean; created?: boolean; protocolFee?: number; boostedApr?: number } = {},
): FeeTierData => ({
  id: `pool-${feeAmount}`,
  fee: {
    feeAmount,
    isDynamic: opts.isDynamic ?? false,
    tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount, OFF),
  },
  formattedFee: `${feeAmount}`,
  totalLiquidityUsd: Number(tvl),
  percentage: new Percent(1, 100),
  tvl,
  created: opts.created ?? tvl !== '0',
  protocolFee: opts.protocolFee,
  boostedApr: opts.boostedApr,
})

const record = (...entries: FeeTierData[]): Record<string, FeeTierData> =>
  Object.fromEntries(entries.map((entry) => [keyOf(entry.fee.feeAmount, entry.fee.isDynamic), entry]))

// Fee amounts (pips) for the four canonical new tiers: 0.75 / 3.75 / 25 / 90 bps.
const NEW_TIER_FEE_AMOUNTS = [75, 375, 2500, 9000]

// Tick-spacing config: OFF → 2x everywhere; L2_ON → 1x on the L2 (Base).
const OFF = { chainId: undefined, l2TickSpacingEnabled: false }
const L2_ON = { chainId: UniverseChainId.Base, l2TickSpacingEnabled: true }

describe('getCreateFeeTierOptions', () => {
  it('returns the pool-backed defaults unchanged when the flag is off', () => {
    const defaultFeeTiers = [
      { value: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 60 }, title: 't', tvl: '0' },
    ]
    expect(
      getCreateFeeTierOptions({
        isFeeDisplayEnabled: false,
        protocolVersion: ProtocolVersion.V4,
        defaultFeeTiers,
        feeTierData: {},
        hook: undefined,
        l2TickSpacingConfig: OFF,
      }),
    ).toBe(defaultFeeTiers)
  })

  it('attaches a subtractive breakdown to v3 tiers without swapping them', () => {
    // A 0.3% v3 pool with a served 5 bps (500 pips) protocol fee.
    const defaultFeeTiers = [
      {
        value: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 60 },
        title: 't',
        tvl: '100',
        protocolFee: 500,
      },
    ]
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData: {},
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    // No keep-vs-swap for v3; the tier is unchanged except for the breakdown.
    expect(result.map((option) => option.value.feeAmount)).toEqual([FeeAmount.MEDIUM])
    // v3 carves the protocol fee out of the all-in tier: LP 25 + protocol 5 = 30 effective (the tier).
    expect(result[0].feeBreakdown).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 5,
      effectiveFeeBps: 30,
      version: ProtocolVersion.V3,
    })
  })

  it('derives the subtractive breakdown from the schedule for not-yet-created v3 tiers (no served fee)', () => {
    // A brand-new v3 pair: no pool at any tier, so no served protocol fee — the schedule fills it.
    const defaultFeeTiers = [
      { value: { feeAmount: FeeAmount.LOWEST, isDynamic: false, tickSpacing: 1 }, title: 't', tvl: '0' },
      { value: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 60 }, title: 't', tvl: '0' },
    ]
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData: {},
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    // 0.01% takes 1/4: LP 0.75 + protocol 0.25 = 1 effective (the tier).
    expect(result[0].feeBreakdown).toEqual({
      lpFeeBps: 0.75,
      protocolFeeBps: 0.25,
      effectiveFeeBps: 1,
      version: ProtocolVersion.V3,
    })
    // 0.30% takes 1/6: LP 25 + protocol 5 = 30 effective.
    expect(result[1].feeBreakdown).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 5,
      effectiveFeeBps: 30,
      version: ProtocolVersion.V3,
    })
  })

  it('marks not-yet-created v3 tiers as not created so they render "Not created"', () => {
    // A brand-new v3 pair: the default tiers are seeded into feeTierData with created:false.
    const feeTierData = record(tierData(FeeAmount.LOWEST, '0'), tierData(FeeAmount.MEDIUM, '0'))
    const defaultFeeTiers = [
      { value: { feeAmount: FeeAmount.LOWEST, isDynamic: false, tickSpacing: 1 }, title: 't', tvl: '0' },
      { value: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 60 }, title: 't', tvl: '0' },
    ]
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData,
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    expect(result.every((option) => option.created === false)).toBe(true)
  })

  it('marks an existing v3 tier as created', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '10000'))
    const defaultFeeTiers = [
      { value: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 60 }, title: 't', tvl: '10000' },
    ]
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData,
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    expect(result[0].created).toBe(true)
  })

  it('shows the four new canonical tiers for a brand-new v4 pair', () => {
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: {},
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    // The four new tiers in pairing (ascending) order — no old tiers, no pool data, all not-yet-created.
    expect(result.map((option) => option.value.feeAmount)).toEqual(NEW_TIER_FEE_AMOUNTS)
    expect(result.every((option) => option.feeBreakdown !== undefined && option.tvl === undefined)).toBe(true)
    expect(result.every((option) => option.created === false)).toBe(true)
    // Each canonical slot keeps its paired-tier "Best for …" title.
    expect(result.every((option) => option.title.length > 0)).toBe(true)
    // e.g. the 25 bps tier: 25 LP + 4 protocol = 29 effective (curve).
    expect(result[2].feeBreakdown).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 4,
      effectiveFeeBps: 29,
      version: ProtocolVersion.V4,
    })
  })

  it('keeps a deep old tier and shows the new tier for the shallow pairings', () => {
    // Only the 0.30% pool is deep; the others have no pool.
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '10000', { protocolFee: 500, boostedApr: 5 }))
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    // 0.30% (3000) kept; the rest are the paired new tiers.
    expect(result.map((option) => option.value.feeAmount)).toEqual([75, 375, FeeAmount.MEDIUM, 9000])
    const kept = result[2]
    expect(kept.tvl).toBe('10000')
    expect(kept.boostedApr).toBe(5)
    // The kept old pool is created; the synthesized new tiers aren't.
    expect(kept.created).toBe(true)
    expect(result.filter((_, i) => i !== 2).every((option) => option.created === false)).toBe(true)
    // Kept tier stacks the served 5 bps (500 pips) protocol fee on the 30 bps LP fee.
    expect(kept.feeBreakdown).toEqual({
      lpFeeBps: 30,
      protocolFeeBps: 5,
      effectiveFeeBps: 35,
      version: ProtocolVersion.V4,
    })
  })

  it('keeps an old tier at exactly $5k and swaps one just below', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '5000'), tierData(FeeAmount.HIGH, '4999'))
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    // 0.30% at exactly 5k is kept; 1% just below swaps to the paired 0.90% new tier.
    expect(result.map((option) => option.value.feeAmount)).toEqual([75, 375, FeeAmount.MEDIUM, 9000])
  })

  it('shows a pool already sitting at the new tier, with its served data', () => {
    // 0.30% is shallow so its pairing shows 0.25%, where a pool already exists with a served 8 bps fee.
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '0'), tierData(2500, '12345', { protocolFee: 800 }))
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    expect(result.map((option) => option.value.feeAmount)).toEqual(NEW_TIER_FEE_AMOUNTS)
    const atNewTier = result[2]
    expect(atNewTier.tvl).toBe('12345')
    // v4 stacks: LP 25 + served protocol 8 = 33 effective, from the backend value (not the curve pairing).
    expect(atNewTier.feeBreakdown).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 8,
      effectiveFeeBps: 33,
      version: ProtocolVersion.V4,
    })
  })

  it('appends the dynamic-fee box from defaultFeeTiers after the canonical tiers', () => {
    // getDefaultFeeTiersWithData already builds the dynamic option (top-by-TVL); the v4 grid reuses it.
    const dynamicOption = { value: DYNAMIC_FEE_DATA, title: 'dynamic', tvl: '50000', boostedApr: 7 }
    const feeTierData = record(tierData(DYNAMIC_FEE_DATA.feeAmount, '50000', { isDynamic: true, boostedApr: 7 }))
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [dynamicOption],
      feeTierData,
      hook: '0x0000000000000000000000000000000000000088',
      l2TickSpacingConfig: OFF,
    })
    // The four canonical tiers, then the dynamic tier appended last.
    expect(result.map((option) => option.value.feeAmount)).toEqual([
      ...NEW_TIER_FEE_AMOUNTS,
      DYNAMIC_FEE_DATA.feeAmount,
    ])
    // Reused verbatim from defaultFeeTiers — not reconstructed (no fee breakdown to hang a tooltip on).
    expect(result[result.length - 1]).toBe(dynamicOption)
    expect(result[result.length - 1].feeBreakdown).toBeUndefined()
  })

  it('does not append a dynamic box when defaultFeeTiers has none (vanilla v4 pair)', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '10000'))
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
      l2TickSpacingConfig: OFF,
    })
    expect(result.every((option) => !option.value.isDynamic)).toBe(true)
  })

  it('degrades to unavailable breakdowns for hooked pools', () => {
    const result = getCreateFeeTierOptions({
      isFeeDisplayEnabled: true,
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: {},
      hook: '0x0000000000000000000000000000000000000088',
      l2TickSpacingConfig: OFF,
    })
    // Hooked pools can't be computed, so the protocol fee is unavailable and effective falls back to LP.
    expect(result.every((option) => option.feeBreakdown?.protocolFeeBps === undefined)).toBe(true)
    expect(result.every((option) => option.feeBreakdown?.effectiveFeeBps === option.feeBreakdown?.lpFeeBps)).toBe(true)
  })
})

describe('getCreateFeeTierSearchData', () => {
  it('returns the tiers unchanged when the flag is off', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '0'))
    expect(
      getCreateFeeTierSearchData({
        useNewDefaultFeeTiers: false,
        feeTierData,
        formatPercent,
        l2TickSpacingConfig: OFF,
      }),
    ).toEqual(Object.values(feeTierData))
  })

  it('shows only the new default tiers for a brand-new pair, dropping the empty old defaults', () => {
    const feeTierData = record(
      tierData(FeeAmount.LOWEST, '0'),
      tierData(FeeAmount.LOW, '0'),
      tierData(FeeAmount.MEDIUM, '0'),
      tierData(FeeAmount.HIGH, '0'),
    )
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      l2TickSpacingConfig: OFF,
    })
    // The four new default tiers only — the seeded old defaults have no TVL, so they're dropped.
    expect(result.map((data) => data.fee.feeAmount)).toEqual(NEW_TIER_FEE_AMOUNTS)
    expect(result.every((data) => !data.created && data.tvl === '0' && data.feeBreakdown !== undefined)).toBe(true)
    expect(result[2].feeBreakdown).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 4,
      effectiveFeeBps: 29,
      version: ProtocolVersion.V4,
    })
  })

  it('synthesizes new default tiers with 1x tick spacing when L2 tick spacing is enabled', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '0'))
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      l2TickSpacingConfig: L2_ON,
    })
    // 75 / 375 / 2500 / 9000 pips at 1x (vs 2 / 8 / 50 / 180 at 2x).
    expect(result.map((data) => data.fee.feeAmount)).toEqual(NEW_TIER_FEE_AMOUNTS)
    expect(result.map((data) => data.fee.tickSpacing)).toEqual([1, 4, 25, 90])
  })

  it('shows an old tier only when it has TVL, dropping the empty ones', () => {
    // Only the 0.30% old default has liquidity; the other empty old defaults are hidden.
    const feeTierData = record(
      tierData(FeeAmount.LOWEST, '0'),
      tierData(FeeAmount.LOW, '0'),
      tierData(FeeAmount.MEDIUM, '10000', { protocolFee: 500 }),
      tierData(FeeAmount.HIGH, '0'),
    )
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      l2TickSpacingConfig: OFF,
    })
    // New defaults first, then the only old tier with liquidity.
    expect(result.map((data) => data.fee.feeAmount)).toEqual([...NEW_TIER_FEE_AMOUNTS, FeeAmount.MEDIUM])
    const kept = result.find((data) => data.fee.feeAmount === FeeAmount.MEDIUM)
    expect(kept?.tvl).toBe('10000')
    expect(kept?.feeBreakdown).toEqual({
      lpFeeBps: 30,
      protocolFeeBps: 5,
      effectiveFeeBps: 35,
      version: ProtocolVersion.V4,
    })
  })

  it('keeps a dynamic tier and a non-canonical pool with TVL, but drops a non-canonical pool without TVL', () => {
    const feeTierData = record(
      tierData(DYNAMIC_FEE_DATA.feeAmount, '0', { isDynamic: true }),
      tierData(400, '100'),
      tierData(600, '0'),
    )
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      l2TickSpacingConfig: OFF,
    })
    // New defaults, then the dynamic tier (always kept) and the 0.04% pool with TVL; the empty 0.06% is dropped.
    expect(result.map((data) => data.fee.feeAmount)).toEqual([...NEW_TIER_FEE_AMOUNTS, DYNAMIC_FEE_DATA.feeAmount, 400])
    const dynamic = result.find((data) => data.fee.isDynamic)
    expect(dynamic?.feeBreakdown).toBeUndefined()
  })

  it('shows a new default tier from its real pool when one exists, without duplicating it', () => {
    // A pool already sits at the 0.25% new tier — it appears once, in the new-default slot.
    const feeTierData = record(tierData(2500, '12345'))
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      l2TickSpacingConfig: OFF,
    })
    expect(result.map((data) => data.fee.feeAmount)).toEqual(NEW_TIER_FEE_AMOUNTS)
    const atNewTier = result[2]
    expect(atNewTier.tvl).toBe('12345')
    expect(atNewTier.created).toBe(true)
  })

  it('marks synthesized new-tier breakdowns unavailable for hooked pools', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '0'))
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      hook: '0x0000000000000000000000000000000000000088',
      l2TickSpacingConfig: OFF,
    })
    expect(result.every((data) => data.feeBreakdown?.protocolFeeBps === undefined)).toBe(true)
  })
})

describe('getSteeredRecommendedFee', () => {
  const feeData = (feeAmount: number) => ({
    isDynamic: false,
    feeAmount,
    tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount, OFF),
  })

  it('steers a shallow canonical default to its paired new tier', () => {
    // 0.30% (old default) with < $5k liquidity → the paired 0.25% (2500) new tier.
    expect(
      getSteeredRecommendedFee({ mostUsedFee: feeData(FeeAmount.MEDIUM), tvl: '2000', l2TickSpacingConfig: OFF }),
    ).toEqual({
      isDynamic: false,
      feeAmount: 2500,
      tickSpacing: 50,
    })
  })

  it('uses the 1x tick spacing for the steered new tier when L2 tick spacing is enabled', () => {
    // Same steer as above, but 2500 pips → 25 (1x) instead of 50 (2x).
    expect(
      getSteeredRecommendedFee({ mostUsedFee: feeData(FeeAmount.MEDIUM), tvl: '2000', l2TickSpacingConfig: L2_ON }),
    ).toEqual({
      isDynamic: false,
      feeAmount: 2500,
      tickSpacing: 25,
    })
  })

  it('keeps a deep canonical default as-is', () => {
    expect(
      getSteeredRecommendedFee({ mostUsedFee: feeData(FeeAmount.MEDIUM), tvl: '10000', l2TickSpacingConfig: OFF }),
    ).toEqual(feeData(FeeAmount.MEDIUM))
  })

  it('keeps a non-default tier as-is', () => {
    // 0.04% (400 pips) is not a canonical old default, so there is nothing to steer to.
    expect(getSteeredRecommendedFee({ mostUsedFee: feeData(400), tvl: '0', l2TickSpacingConfig: OFF })).toEqual(
      feeData(400),
    )
  })

  it('keeps a tier that is already a new canonical tier as-is', () => {
    // 0.25% (2500) is a new tier, not an old default, so it is not steered further.
    expect(getSteeredRecommendedFee({ mostUsedFee: feeData(2500), tvl: '0', l2TickSpacingConfig: OFF })).toEqual(
      feeData(2500),
    )
  })
})

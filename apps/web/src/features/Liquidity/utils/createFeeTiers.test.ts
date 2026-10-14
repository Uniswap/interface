import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { DYNAMIC_FEE_DATA } from 'uniswap/src/features/positions/types'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'
import {
  getCreatedPoolAtFeeAmount,
  getCreateFeeTierOptions,
  getCreateFeeTierSearchData,
} from '~/features/Liquidity/utils/createFeeTiers'
import {
  calculateTickSpacingFromFeeAmount,
  type FeeTierOption,
  getFeeTierKey,
} from '~/features/Liquidity/utils/feeTiers'
import { FeeTierData } from '~/types/liquidity'

const formatPercent = (percent: string | number | undefined, _maxDecimals?: PercentNumberDecimals) =>
  `${Number(percent) * 100}%`

const keyOf = (feeAmount: number) =>
  getFeeTierKey({ feeTier: feeAmount, tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount) })

const tierData = (
  feeAmount: number,
  tvl: string,
  opts: { isDynamic?: boolean; created?: boolean; protocolFee?: number; boostedApr?: number } = {},
): FeeTierData => ({
  id: `pool-${feeAmount}`,
  fee: {
    feeAmount,
    isDynamic: opts.isDynamic ?? false,
    tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount),
  },
  // Mirrors production: every dynamic-fee pool reads as "Dynamic fee"; static tiers read as their amount.
  formattedFee: opts.isDynamic ? 'Dynamic fee' : `${feeAmount}`,
  totalLiquidityUsd: Number(tvl),
  percentage: new Percent(1, 100),
  tvl,
  created: opts.created ?? tvl !== '0',
  protocolFee: opts.protocolFee,
  boostedApr: opts.boostedApr,
})

const record = (...entries: FeeTierData[]): Record<string, FeeTierData> =>
  Object.fromEntries(entries.map((entry) => [keyOf(entry.fee.feeAmount), entry]))

// Fee amounts (pips) for the four canonical new tiers: 0.75 / 3.75 / 25 / 90 bps.
const NEW_TIER_FEE_AMOUNTS = [75, 375, 2500, 9000]

describe('getCreateFeeTierOptions', () => {
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
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData: {},
      hook: undefined,
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
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData: {},
      hook: undefined,
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
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData,
      hook: undefined,
    })
    expect(result.every((option) => option.created === false)).toBe(true)
  })

  it('marks an existing v3 tier as created', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '10000'))
    const defaultFeeTiers = [
      { value: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 60 }, title: 't', tvl: '10000' },
    ]
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V3,
      defaultFeeTiers,
      feeTierData,
      hook: undefined,
    })
    expect(result[0].created).toBe(true)
  })

  it('shows the four new canonical tiers for a brand-new v4 pair', () => {
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: {},
      hook: undefined,
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

  it('leads with a deep old tier and backfills the shallow pairings with new tiers', () => {
    // Only the 0.30% pool is deep; the others have no pool.
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '10000', { protocolFee: 500, boostedApr: 5 }))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    // 0.30% (3000) claims the first slot; the remaining three are backfilled with new tiers. The 0.25%
    // pairing is skipped — offering it beside the deep 0.30% pool is the fragmentation it exists to avoid.
    expect(result.map((option) => option.value.feeAmount)).toEqual([FeeAmount.MEDIUM, 75, 375, 9000])
    const kept = result[0]
    expect(kept.tvl).toBe('10000')
    expect(kept.boostedApr).toBe(5)
    // The kept old pool is created; the synthesized new tiers aren't.
    expect(kept.created).toBe(true)
    expect(result.slice(1).every((option) => option.created === false)).toBe(true)
    // Kept tier stacks the served 5 bps (500 pips) protocol fee on the 30 bps LP fee.
    expect(kept.feeBreakdown).toEqual({
      lpFeeBps: 30,
      protocolFeeBps: 5,
      effectiveFeeBps: 35,
      version: ProtocolVersion.V4,
    })
  })

  it('keeps an old tier at exactly $5k and drops one just below', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '5000'), tierData(FeeAmount.HIGH, '4999'))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    // 0.30% at exactly 5k earns a box; 1% just below doesn't, so its paired 0.90% new tier backfills.
    expect(result.map((option) => option.value.feeAmount)).toEqual([FeeAmount.MEDIUM, 75, 375, 9000])
  })

  it('fills the grid with the deepest pools, dropping the canonical tiers entirely', () => {
    // USDC/USDT v4 on mainnet: the three deepest pools sit at fee amounts no pairing covers, so before
    // this the grid showed one $650K box beside three empty new tiers and hid $22M of liquidity.
    const feeTierData = record(
      tierData(7, '9251405.85'),
      tierData(10, '7122418.97'),
      tierData(8, '6016403.81'),
      tierData(100, '650091.16'),
      tierData(35, '16379.98'),
      tierData(5, '4453.49'),
    )
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    // Four qualifying pools fill every slot, deepest first — no room left for a canonical tier. The $16K
    // tier is cut by the grid width, the $4.4K one by the TVL bar.
    expect(result.map((option) => option.value.feeAmount)).toEqual([7, 10, 8, 100])
    expect(result.every((option) => option.created === true)).toBe(true)
  })

  it('gives a deep non-canonical pool a box alongside the canonical tiers', () => {
    // DAI/USDC: the pair's deepest pool is at 0.0082%, which no pairing covers.
    const feeTierData = record(tierData(82, '14613.42'), tierData(100, '1296.84'))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    // The 0.01% pool is too shallow to keep, so its paired 0.0075% tier backfills as usual.
    expect(result.map((option) => option.value.feeAmount)).toEqual([82, 75, 375, 2500])
    expect(result[0].tvl).toBe('14613.42')
  })

  it('shows both sides of a pairing when both pools are deep', () => {
    // The pairing exists to stop us pushing users into an empty new-tier pool beside a deep old one.
    // Once both hold real liquidity there's nothing left to fragment, so both are real destinations.
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '10000'), tierData(2500, '8000'))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    expect(result.map((option) => option.value.feeAmount)).toEqual([FeeAmount.MEDIUM, 2500, 75, 375])
  })

  it("keeps a new tier's subtitle once its pool is deep enough to claim its own box", () => {
    // The 0.25% placeholder borrows the 0.30% subtitle; the same tier backed by a deep pool must read the same.
    const placeholder = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: {},
      hook: undefined,
    }).find((option) => option.value.feeAmount === 2500)
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: record(tierData(2500, '12345')),
      hook: undefined,
    })
    expect(result[0].value.feeAmount).toBe(2500)
    expect(result[0].tvl).toBe('12345')
    expect(placeholder?.title).not.toBe('')
    expect(result[0].title).toBe(placeholder?.title)
  })

  it('leaves a non-canonical tier without a "Best for …" subtitle', () => {
    // getFeeTierTitle only names the default tiers (old and new), so a pool at any other fee renders a
    // blank subtitle — as it did before the canonical grid, when v4 showed the top four tiers by TVL.
    const feeTierData = record(tierData(7, '9251405.85'), tierData(100, '650091.16'))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    expect(result[0].title).toBe('')
    expect(result[1].title.length).toBeGreaterThan(0)
  })

  it('gives a shallow incentivized non-canonical pool a box', () => {
    // A rewarded pool at a fee no pairing covers: without a box its reward APR has nowhere to render and
    // "Switch pools" has to fall back to fee tier search.
    const feeTierData = record(tierData(295, '12', { boostedApr: 4200 }))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    expect(result.map((option) => option.value.feeAmount)).toEqual([295, 75, 375, 2500])
    expect(result[0].boostedApr).toBe(4200)
  })

  it('keeps a shallow old tier when its pool is incentivized', () => {
    // A $7 TVL 0.05% pool with a live rewards campaign — kept despite being far below $5k, so its
    // reward APR still has a box to render in.
    const feeTierData = record(tierData(500, '7', { boostedApr: 1709392 }))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    // 0.05% (500) earns a box despite the TVL bar, and its 0.0375% pairing is skipped as a backfill.
    expect(result.map((option) => option.value.feeAmount)).toEqual([500, 75, 2500, 9000])
    expect(result[0].boostedApr).toBe(1709392)
    expect(result[0].created).toBe(true)
  })

  it('prefers the incentivized pool when one fee amount backs several pools', () => {
    // SPY/USDG on Robinhood: 0.05% is backed by an incentivized pool (tickSpacing 5) and a dust one
    // (tickSpacing 10, the canonical default key, so it sorts first in the merged record).
    const dust = tierData(500, '27')
    const incentivized: FeeTierData = {
      ...tierData(500, '1920', { boostedApr: 1370409 }),
      fee: { feeAmount: 500, isDynamic: false, tickSpacing: 5 },
    }
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: { '500-10': dust, '500-5': incentivized },
      hook: undefined,
    })
    // The incentivized pool represents the 0.05% box, not the dust pool listed ahead of it.
    expect(result[0].value).toEqual(incentivized.fee)
    expect(result[0].boostedApr).toBe(1370409)
    expect(result[0].tvl).toBe('1920')
  })

  it('shows a pool already sitting at the new tier, with its served data', () => {
    // A deep pool already at the 0.25% new tier; the empty 0.30% pool it pairs with earns nothing.
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '0'), tierData(2500, '12345', { protocolFee: 800 }))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    // 0.25% leads on TVL; its own pairing is then skipped as a backfill, so 0.90% takes the last slot.
    expect(result.map((option) => option.value.feeAmount)).toEqual([2500, 75, 375, 9000])
    const atNewTier = result[0]
    expect(atNewTier.tvl).toBe('12345')
    // v4 stacks: LP 25 + served protocol 8 = 33 effective, from the backend value (not the curve pairing).
    expect(atNewTier.feeBreakdown).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 8,
      effectiveFeeBps: 33,
      version: ProtocolVersion.V4,
    })
  })

  it('appends the deployed dynamic-fee pool after the canonical tiers', () => {
    const dynamicPool = tierData(DYNAMIC_FEE_DATA.feeAmount, '50000', { isDynamic: true, boostedApr: 7 })
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: record(dynamicPool),
      hook: '0x0000000000000000000000000000000000000088',
    })
    // The four canonical tiers, then the dynamic tier appended last.
    expect(result.map((option) => option.value.feeAmount)).toEqual([
      ...NEW_TIER_FEE_AMOUNTS,
      DYNAMIC_FEE_DATA.feeAmount,
    ])
    const dynamicBox = result[result.length - 1]
    expect(dynamicBox.value).toEqual(dynamicPool.fee)
    expect(dynamicBox.tvl).toBe('50000')
    expect(dynamicBox.boostedApr).toBe(7)
    expect(dynamicBox.created).toBe(true)
    // A dynamic tier has no fixed rate to break down.
    expect(dynamicBox.feeBreakdown).toBeUndefined()
  })

  it('appends a dynamic pool however shallow it is', () => {
    // The v4 grid used to inherit a $1k TVL floor (and a top-4-by-TVL cut) from the list it read the
    // dynamic option out of; a hook's only dynamic pool now gets its box regardless of depth.
    const dustDynamic = tierData(DYNAMIC_FEE_DATA.feeAmount, '12', { isDynamic: true })
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: record(dustDynamic),
      hook: '0x0000000000000000000000000000000000000088',
    })
    expect(result.at(-1)?.value).toEqual(dustDynamic.fee)
  })

  it('skips the not-yet-created dynamic default seeded into feeTierData', () => {
    const seeded = tierData(DYNAMIC_FEE_DATA.feeAmount, '0', { isDynamic: true, created: false })
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: record(seeded),
      hook: '0x0000000000000000000000000000000000000088',
    })
    expect(result.every((option) => !option.value.isDynamic)).toBe(true)
  })

  it('prefers an incentivized dynamic pool over a deeper one on the same hook', () => {
    const deep: FeeTierData = {
      ...tierData(450, '1700000', { isDynamic: true }),
      fee: { feeAmount: 450, isDynamic: true, tickSpacing: 60 },
    }
    const boosted: FeeTierData = {
      ...tierData(14800, '900', { isDynamic: true, boostedApr: 12 }),
      fee: { feeAmount: 14800, isDynamic: true, tickSpacing: 8 },
    }
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: { '450-60': deep, '14800-8': boosted },
      hook: '0x0000000000000000000000000000000000000088',
    })
    expect(result.at(-1)?.value).toEqual(boosted.fee)
  })

  it('re-points the dynamic box to the URL-pinned tick spacing, else shows the deepest', () => {
    // Two dynamic-fee pools on the same hook, distinguishable only by tick spacing.
    const deepDynamic: FeeTierData = {
      ...tierData(450, '1700000', { isDynamic: true }),
      id: 'dyn-deep',
      fee: { feeAmount: 450, isDynamic: true, tickSpacing: 60 },
    }
    const dustDynamic: FeeTierData = {
      ...tierData(14800, '0.34', { isDynamic: true, created: true }),
      id: 'dyn-dust',
      fee: { feeAmount: 14800, isDynamic: true, tickSpacing: 8 },
    }
    const feeTierData = { '450-60': deepDynamic, '14800-8': dustDynamic }
    const hook = '0x0000000000000000000000000000000000000088'

    const withoutPin = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook,
    })
    expect(withoutPin.at(-1)?.value).toEqual(deepDynamic.fee)

    // Deep-linking the shallow pool's tick spacing re-points the box at it, stranding the deeper sibling.
    const withPin = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook,
      selectedFee: dustDynamic.fee,
    })
    expect(withPin.at(-1)?.value).toEqual(dustDynamic.fee)
    expect(withPin.at(-1)?.tvl).toBe('0.34')
    // A dynamic tier has no fixed rate to break down, so the re-pointed box carries no breakdown.
    expect(withPin.at(-1)?.feeBreakdown).toBeUndefined()
  })

  it('does not append a dynamic box when no dynamic pool exists (vanilla v4 pair)', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '10000'))
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook: undefined,
    })
    expect(result.every((option) => !option.value.isDynamic)).toBe(true)
  })

  it('degrades to unavailable breakdowns for hooked pools', () => {
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData: {},
      hook: '0x0000000000000000000000000000000000000088',
    })
    // Hooked pools can't be computed, so the protocol fee is unavailable and effective falls back to LP.
    expect(result.every((option) => option.feeBreakdown?.protocolFeeBps === undefined)).toBe(true)
    expect(result.every((option) => option.feeBreakdown?.effectiveFeeBps === option.feeBreakdown?.lpFeeBps)).toBe(true)
  })
})

describe('getCreateFeeTierSearchData', () => {
  it('returns the tiers unchanged when the new defaults are not in use', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '0'))
    expect(
      getCreateFeeTierSearchData({
        useNewDefaultFeeTiers: false,
        feeTierData,
        formatPercent,
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

  it('synthesizes new default tiers with tick spacing derived from the fee', () => {
    const feeTierData = record(tierData(FeeAmount.MEDIUM, '0'))
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
    })
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
    })
    // New defaults, then the dynamic tier (always kept) and the 0.04% pool with TVL; the empty 0.06% is dropped.
    expect(result.map((data) => data.fee.feeAmount)).toEqual([...NEW_TIER_FEE_AMOUNTS, DYNAMIC_FEE_DATA.feeAmount, 400])
    const dynamic = result.find((data) => data.fee.isDynamic)
    expect(dynamic?.feeBreakdown).toBeUndefined()
  })

  it('collapses two dynamic pools differing only by tick spacing to the deepest, honoring a pinned one', () => {
    // Two dynamic-fee pools on the same hook, one deep and one dust — a user reads both as "Dynamic fee".
    const deepDynamic: FeeTierData = {
      ...tierData(450, '1700000', { isDynamic: true }),
      id: 'dyn-deep',
      fee: { feeAmount: 450, isDynamic: true, tickSpacing: 60 },
    }
    const dustDynamic: FeeTierData = {
      ...tierData(14800, '0.34', { isDynamic: true }),
      id: 'dyn-dust',
      fee: { feeAmount: 14800, isDynamic: true, tickSpacing: 8 },
    }
    const feeTierData = { '450-60': deepDynamic, '14800-8': dustDynamic }

    const result = getCreateFeeTierSearchData({ useNewDefaultFeeTiers: true, feeTierData, formatPercent })
    const dynamics = result.filter((data) => data.fee.isDynamic)
    expect(dynamics).toHaveLength(1)
    expect(dynamics[0].id).toBe('dyn-deep')

    // A URL-pinned tick spacing wins over TVL, so the direct link resolves to the dust pool.
    const pinned = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      selectedFee: dustDynamic.fee,
    })
    const pinnedDynamics = pinned.filter((data) => data.fee.isDynamic)
    expect(pinnedDynamics).toHaveLength(1)
    expect(pinnedDynamics[0].id).toBe('dyn-dust')
  })

  it('collapses two static pools at one fee amount to the deepest, honoring a pinned tick spacing', () => {
    // Same fee value (0.30%), different tick spacing — a pre-cutover pool beside a new-schedule one.
    const deep: FeeTierData = {
      ...tierData(3000, '2000000'),
      id: 'st-deep',
      fee: { feeAmount: 3000, isDynamic: false, tickSpacing: 6 },
    }
    const shallow: FeeTierData = {
      ...tierData(3000, '1000000'),
      id: 'st-shallow',
      fee: { feeAmount: 3000, isDynamic: false, tickSpacing: 60 },
    }
    const feeTierData = { '3000-6': deep, '3000-60': shallow }

    const result = getCreateFeeTierSearchData({ useNewDefaultFeeTiers: true, feeTierData, formatPercent })
    const at3000 = result.filter((data) => data.fee.feeAmount === 3000)
    expect(at3000).toHaveLength(1)
    expect(at3000[0].id).toBe('st-deep')

    const pinned = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      selectedFee: shallow.fee,
    })
    const pinnedAt3000 = pinned.filter((data) => data.fee.feeAmount === 3000)
    expect(pinnedAt3000).toHaveLength(1)
    expect(pinnedAt3000[0].id).toBe('st-shallow')
  })

  it('does not let a pin on a seeded (not-created) canonical default evict the real deep pool', () => {
    // A real deep 0.25% pool plus the seeded canonical default at that fee (created:false, zero TVL). The URL
    // pins the seeded default's tick spacing; pinnedPoolFor must skip it (not created) so the deep pool stays.
    const realDeep: FeeTierData = {
      ...tierData(2500, '1000000'),
      id: 'real',
      fee: { feeAmount: 2500, isDynamic: false, tickSpacing: 60 },
    }
    const seededDefault: FeeTierData = {
      ...tierData(2500, '0'),
      id: 'seeded',
      fee: { feeAmount: 2500, isDynamic: false, tickSpacing: 25 },
    }
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData: { '2500-60': realDeep, '2500-25': seededDefault },
      formatPercent,
      selectedFee: seededDefault.fee,
    })
    const at2500 = result.filter((data) => data.fee.feeAmount === 2500)
    expect(at2500).toHaveLength(1)
    expect(at2500[0].id).toBe('real')
    expect(at2500[0].created).toBe(true)
  })

  it('drops a boosted sibling stranded by a pin, so the rewards banner can hide', () => {
    // A rewarded 0.05% pool and its non-incentivized dust sibling at a different tick spacing.
    const boosted: FeeTierData = {
      ...tierData(500, '50000', { boostedApr: 10 }),
      id: 'boosted',
      fee: { feeAmount: 500, isDynamic: false, tickSpacing: 10 },
    }
    const dust: FeeTierData = {
      ...tierData(500, '5', { boostedApr: 0 }),
      id: 'dust',
      fee: { feeAmount: 500, isDynamic: false, tickSpacing: 60 },
    }
    const feeTierData = { '500-10': boosted, '500-60': dust }
    // No pin: byWorthJoining keeps the incentivized pool, so a boosted tier is reachable.
    const noPin = getCreateFeeTierSearchData({ useNewDefaultFeeTiers: true, feeTierData, formatPercent })
    expect(noPin.some((data) => data.boostedApr && data.boostedApr > 0)).toBe(true)
    // Deep-linking the dust sibling strands the boosted one — no reachable boosted tier, so no banner.
    const pinned = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      selectedFee: dust.fee,
    })
    expect(pinned.some((data) => data.boostedApr && data.boostedApr > 0)).toBe(false)
  })

  it('shows a new default tier from its real pool when one exists, without duplicating it', () => {
    // A pool already sits at the 0.25% new tier — it appears once, in the new-default slot.
    const feeTierData = record(tierData(2500, '12345'))
    const result = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
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
    })
    expect(result.every((data) => data.feeBreakdown?.protocolFeeBps === undefined)).toBe(true)
  })
})

describe('URL-pinned tick spacing (PDP deep link)', () => {
  // A pool detail page links into the create flow with the pool's exact fee in the URL, e.g.
  // ?fee={"isDynamic":true,"feeAmount":14800,"tickSpacing":8}. That becomes `selectedFee`, and both surfaces
  // must resolve to the linked pool's tick spacing rather than collapsing to the deepest sibling — even for a
  // dynamic pool, where the linked fee amount differs from the deepest pool's and only the tick spacing pins it.
  const deepDynamic: FeeTierData = {
    ...tierData(450, '1700000', { isDynamic: true }),
    id: 'dyn-deep',
    fee: { feeAmount: 450, isDynamic: true, tickSpacing: 60 },
  }
  const dustDynamic: FeeTierData = {
    ...tierData(14800, '0.34', { isDynamic: true }),
    id: 'dyn-dust',
    fee: { feeAmount: 14800, isDynamic: true, tickSpacing: 8 },
  }
  const feeTierData = { '450-60': deepDynamic, '14800-8': dustDynamic }
  const hook = '0x0000000000000000000000000000000000000088'
  // The PDP deep link for the shallow pool carries its own fee amount + tick spacing.
  const pdpDeepLinkFee = dustDynamic.fee

  it('search list resolves to the linked tick spacing, stranding the deeper sibling', () => {
    const dynamics = getCreateFeeTierSearchData({
      useNewDefaultFeeTiers: true,
      feeTierData,
      formatPercent,
      selectedFee: pdpDeepLinkFee,
    }).filter((data) => data.fee.isDynamic)
    expect(dynamics).toHaveLength(1)
    expect(dynamics[0].id).toBe('dyn-dust')
    expect(dynamics[0].fee.tickSpacing).toBe(8)
  })

  it('grid box resolves to the linked tick spacing over its deeper sibling', () => {
    // Unpinned, the box shows the deep pool; the pin re-points it at the linked (dust) pool.
    const result = getCreateFeeTierOptions({
      protocolVersion: ProtocolVersion.V4,
      defaultFeeTiers: [],
      feeTierData,
      hook,
      selectedFee: pdpDeepLinkFee,
    })
    expect(result.at(-1)?.value).toEqual(dustDynamic.fee)
    expect(result.at(-1)?.value.tickSpacing).toBe(8)
  })
})

describe('getCreatedPoolAtFeeAmount', () => {
  // A pool deployed under the pre-cutover 2x schedule: 0.30% at tick spacing 60, where the fee now derives 30.
  const legacySpacedPool = (feeAmount: number, tvl: string, opts: { boostedApr?: number } = {}): FeeTierData => ({
    ...tierData(feeAmount, tvl, opts),
    fee: { feeAmount, isDynamic: false, tickSpacing: calculateTickSpacingFromFeeAmount(feeAmount) * 2 },
  })
  const at = (feeTierData: Record<string, FeeTierData>, feeAmount: number) =>
    getCreatedPoolAtFeeAmount({ feeTierData, feeAmount })

  it('finds a pool whose tick spacing the fee no longer derives', () => {
    // The whole point: keying off `calculateTickSpacingFromFeeAmount(3000)` would look for 3000-30 and miss
    // this 3000-60 pool, so typing 0.3% would initialize an empty pool beside $5M of liquidity.
    const pool = legacySpacedPool(FeeAmount.MEDIUM, '5000000')
    const feeTierData = { '3000-60': pool }
    expect(at(feeTierData, FeeAmount.MEDIUM)?.fee.tickSpacing).toBe(60)
    expect(at(feeTierData, FeeAmount.MEDIUM)).toBe(pool)
  })

  it('ignores the not-yet-created canonical defaults merged into the record', () => {
    // `mergeFeeTiers` seeds every canonical tier with `created: false` — those are what the create flow is
    // for, so they must not read as an existing pool.
    expect(at(record(tierData(FeeAmount.MEDIUM, '0')), FeeAmount.MEDIUM)).toBeUndefined()
  })

  it('ignores a dynamic-fee pool at the same fee amount', () => {
    const dynamic = tierData(DYNAMIC_FEE_DATA.feeAmount, '1000000', { isDynamic: true })
    expect(at(record(dynamic), DYNAMIC_FEE_DATA.feeAmount)).toBeUndefined()
  })

  it('prefers the incentivized pool, then the deepest, among pools sharing a fee amount', () => {
    const deep = tierData(500, '5000000')
    const incentivized = legacySpacedPool(500, '12', { boostedApr: 20 })
    expect(at({ '500-5': deep, '500-10': incentivized }, 500)).toBe(incentivized)
    expect(at({ '500-5': deep, '500-10': legacySpacedPool(500, '12') }, 500)).toBe(deep)
  })

  it('returns undefined for a fee amount no pool covers', () => {
    expect(at(record(tierData(FeeAmount.MEDIUM, '5000000')), 82)).toBeUndefined()
    // An empty create input parses to NaN; it must not match anything.
    expect(at(record(tierData(FeeAmount.MEDIUM, '5000000')), NaN)).toBeUndefined()
  })
})

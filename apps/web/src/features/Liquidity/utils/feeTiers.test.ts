import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Percent } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import { MAX_LP_FEE } from 'uniswap/src/constants/pools'
import { DEFAULT_FEE_TIER_PAIRS } from 'uniswap/src/features/fees/feeTiers'
import { bpsToFeeAmount } from 'uniswap/src/features/fees/feeUnits'
import { DYNAMIC_FEE_DATA } from 'uniswap/src/features/positions/types'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'
import {
  calculateTickSpacingFromFeeAmount,
  getCommonFeeTiersWithData,
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  getDefaultFeeTiersWithData,
  getFeeTierKey,
  getFeeTierTitle,
  isDynamicFeeTier,
  parseFeeDataFromUrl,
  mergeFeeTiers,
  toNewPoolFeeData,
} from '~/features/Liquidity/utils/feeTiers'
import { FeeTierData } from '~/types/liquidity'

describe('calculateTickSpacingFromFeeAmount', () => {
  it('returns correct tick spacing for typical fee amounts', () => {
    expect(calculateTickSpacingFromFeeAmount(100)).toBe(1) // .01%
    expect(calculateTickSpacingFromFeeAmount(500)).toBe(5) // .05%
    expect(calculateTickSpacingFromFeeAmount(3000)).toBe(30) // .3%
  })

  it('rounds to nearest whole number', () => {
    expect(calculateTickSpacingFromFeeAmount(333)).toBe(3)
    expect(calculateTickSpacingFromFeeAmount(250)).toBe(3)
  })

  it('returns at least 1 for very small fee amounts', () => {
    expect(calculateTickSpacingFromFeeAmount(0.1)).toBe(1)
    expect(calculateTickSpacingFromFeeAmount(0)).toBe(1)
    expect(calculateTickSpacingFromFeeAmount(30)).toBe(1) // round(0.3) = 0, floored to 1
  })

  it('handles large fee amounts', () => {
    expect(calculateTickSpacingFromFeeAmount(10000)).toBe(100)
  })
})

describe('toNewPoolFeeData', () => {
  it('re-keys a tier to the launcher SDK derivation for the fee tiers the availability check covers', () => {
    const spacingFor = (feeAmount: number, tickSpacing: number) =>
      toNewPoolFeeData({ feeAmount, tickSpacing, isDynamic: false }).tickSpacing
    expect(spacingFor(FeeAmount.LOWEST, TICK_SPACINGS[FeeAmount.LOWEST])).toBe(1)
    expect(spacingFor(FeeAmount.LOW, TICK_SPACINGS[FeeAmount.LOW])).toBe(5)
    expect(spacingFor(2500, 50)).toBe(25)
    expect(spacingFor(FeeAmount.MEDIUM, TICK_SPACINGS[FeeAmount.MEDIUM])).toBe(30)
    expect(spacingFor(FeeAmount.HIGH, TICK_SPACINGS[FeeAmount.HIGH])).toBe(100)
  })

  it('passes dynamic fee tiers through untouched (their fee amount is a flag, not bips)', () => {
    expect(toNewPoolFeeData(DYNAMIC_FEE_DATA)).toEqual(DYNAMIC_FEE_DATA)
  })
})

describe('getFeeTierKey', () => {
  it('returns correct key', () => {
    expect(getFeeTierKey({ feeTier: 100, tickSpacing: 60 })).toBe('100-60')
    expect(getFeeTierKey({ feeTier: DYNAMIC_FEE_DATA.feeAmount, tickSpacing: 60 })).toBe(
      `${DYNAMIC_FEE_DATA.feeAmount}-60`,
    )
  })
})

describe('mergeFeeTiers', () => {
  const formatPercent = (percent: string | number | undefined, _maxDecimals?: PercentNumberDecimals) =>
    `${Number(percent) * 100}%`
  const formattedDynamicFeeTier = 'dynamic'
  const staticFee = { feeAmount: 100, isDynamic: false, tickSpacing: 60 }
  const dynamicFee = { feeAmount: DYNAMIC_FEE_DATA.feeAmount, isDynamic: true, tickSpacing: 60 }
  const dynamicFeeKey = getFeeTierKey({ feeTier: dynamicFee.feeAmount, tickSpacing: dynamicFee.tickSpacing })

  const staticFeeTierData: FeeTierData = {
    fee: staticFee,
    formattedFee: '1%',
    totalLiquidityUsd: 10,
    percentage: new Percent(1, 2),
    created: false,
    tvl: '10',
  }

  const defaultDynamicFeeTierData: FeeTierData = {
    fee: DYNAMIC_FEE_DATA,
    formattedFee: formattedDynamicFeeTier,
    totalLiquidityUsd: 20,
    percentage: new Percent(1, 2),
    created: true,
    tvl: '20',
  }

  const dynamicFeeTierData: FeeTierData = {
    fee: dynamicFee,
    formattedFee: formattedDynamicFeeTier,
    totalLiquidityUsd: 30,
    percentage: new Percent(1, 2),
    created: true,
    tvl: '20',
  }

  it('merges defaultFeeData when feeTiers is empty', () => {
    const defaultFeeData = [staticFee]
    const feeTiers = {}
    const result = mergeFeeTiers({
      feeTiers,
      defaultFeeData,
      formatPercent,
      formattedDynamicFeeTier,
    })
    expect(result).toEqual({
      '100-60': {
        ...staticFeeTierData,
        totalLiquidityUsd: 0,
        tvl: '0',
        percentage: new Percent(0, 100),
      },
    })
  })

  it('formats static and dynamic fees correctly', () => {
    const defaultFeeData = [staticFee]
    const dynamicKey = getFeeTierKey({
      feeTier: DYNAMIC_FEE_DATA.feeAmount,
      tickSpacing: DYNAMIC_FEE_DATA.tickSpacing,
    })
    let feeTiers = { [dynamicKey]: defaultDynamicFeeTierData }
    let result = mergeFeeTiers({ feeTiers, defaultFeeData, formatPercent, formattedDynamicFeeTier })
    expect(result).toEqual({
      '100-60': {
        ...staticFeeTierData,
        totalLiquidityUsd: 0,
        tvl: '0',
        percentage: new Percent(0, 100),
      },
      [dynamicKey]: defaultDynamicFeeTierData,
    })

    feeTiers = { [dynamicFeeKey]: dynamicFeeTierData }
    result = mergeFeeTiers({ feeTiers, defaultFeeData, formatPercent, formattedDynamicFeeTier })
    expect(result).toEqual({
      '100-60': {
        ...staticFeeTierData,
        totalLiquidityUsd: 0,
        tvl: '0',
        percentage: new Percent(0, 100),
      },
      [dynamicFeeKey]: dynamicFeeTierData,
    })
  })

  it('merges feeTiers over defaultFeeData', () => {
    const defaultFeeData = [staticFee, dynamicFee]
    const feeTiers = { '100-60': { ...staticFeeTierData, totalLiquidityUsd: 999 } }
    const result = mergeFeeTiers({ feeTiers, defaultFeeData, formatPercent, formattedDynamicFeeTier })

    expect(result).toEqual({
      '100-60': {
        ...staticFeeTierData,
        totalLiquidityUsd: 999,
      },
      [dynamicFeeKey]: {
        ...dynamicFeeTierData,
        created: false,
        totalLiquidityUsd: 0,
        tvl: '0',
        percentage: new Percent(0, 100),
      },
    })
  })

  it('handles empty defaultFeeData and feeTiers', () => {
    const result = mergeFeeTiers({ feeTiers: {}, defaultFeeData: [], formatPercent, formattedDynamicFeeTier })
    expect(result).toEqual({})
  })
})

const DEFAULT_FEE_TIERS = {
  [`${FeeAmount.LOWEST}-${TICK_SPACINGS[FeeAmount.LOWEST]}`]: {
    fee: { feeAmount: FeeAmount.LOWEST, isDynamic: false, tickSpacing: 1 },
    formattedFee: '0.01%',
    totalLiquidityUsd: 100,
    percentage: new Percent(1, 100),
    created: true,
    tvl: '100',
  },
  [`${FeeAmount.LOW_200}-${TICK_SPACINGS[FeeAmount.LOW_200]}`]: {
    fee: { feeAmount: FeeAmount.LOW_200, isDynamic: false, tickSpacing: 2 },
    formattedFee: '0.02%',
    totalLiquidityUsd: 200,
    percentage: new Percent(2, 100),
    created: true,
    tvl: '200',
  },
  [`${FeeAmount.LOW_300}-${TICK_SPACINGS[FeeAmount.LOW_300]}`]: {
    fee: { feeAmount: FeeAmount.LOW_300, isDynamic: false, tickSpacing: 3 },
    formattedFee: '0.03%',
    totalLiquidityUsd: 300,
    percentage: new Percent(3, 100),
    created: true,
    tvl: '300',
  },
  [`${FeeAmount.LOW_400}-${TICK_SPACINGS[FeeAmount.LOW_400]}`]: {
    fee: { feeAmount: FeeAmount.LOW_400, isDynamic: false, tickSpacing: 4 },
    formattedFee: '0.04%',
    totalLiquidityUsd: 400,
    percentage: new Percent(4, 100),
    created: true,
    tvl: '400',
  },
  [`${FeeAmount.LOW}-${TICK_SPACINGS[FeeAmount.LOW]}`]: {
    fee: { feeAmount: FeeAmount.LOW, isDynamic: false, tickSpacing: 5 },
    formattedFee: '0.05%',
    totalLiquidityUsd: 500,
    percentage: new Percent(5, 100),
    created: true,
    tvl: '500',
  },
  [`${FeeAmount.MEDIUM}-${TICK_SPACINGS[FeeAmount.MEDIUM]}`]: {
    fee: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 6 },
    formattedFee: '0.3%',
    totalLiquidityUsd: 600,
    percentage: new Percent(6, 100),
    created: true,
    tvl: '600',
  },
  [`${FeeAmount.HIGH}-${TICK_SPACINGS[FeeAmount.HIGH]}`]: {
    fee: { feeAmount: FeeAmount.HIGH, isDynamic: false, tickSpacing: 7 },
    formattedFee: '1%',
    totalLiquidityUsd: 700,
    percentage: new Percent(7, 100),
    created: true,
    tvl: '700',
  },
}

describe('getDefaultFeeTiersForChainWithDynamicFeeTier', () => {
  it('returns correct fee tiers for Mainnet without dynamic fee', () => {
    const result = getDefaultFeeTiersForChainWithDynamicFeeTier({
      chainId: UniverseChainId.Mainnet,
      dynamicFeeTierEnabled: false,
      protocolVersion: ProtocolVersion.V3,
    })

    // Mainnet should not include LOW_200, LOW_300, LOW_400
    expect(Object.keys(result)).toEqual([
      `${FeeAmount.LOWEST}-${TICK_SPACINGS[FeeAmount.LOWEST]}`,
      `${FeeAmount.LOW}-${TICK_SPACINGS[FeeAmount.LOW]}`,
      `${FeeAmount.MEDIUM}-${TICK_SPACINGS[FeeAmount.MEDIUM]}`,
      `${FeeAmount.HIGH}-${TICK_SPACINGS[FeeAmount.HIGH]}`,
    ])
  })

  it('returns correct fee tiers for Base without dynamic fee', () => {
    const result = getDefaultFeeTiersForChainWithDynamicFeeTier({
      chainId: UniverseChainId.Base,
      dynamicFeeTierEnabled: false,
      protocolVersion: ProtocolVersion.V3,
    })

    // Base should include all fee tiers
    expect(Object.keys(result)).toEqual([
      `${FeeAmount.LOWEST}-${TICK_SPACINGS[FeeAmount.LOWEST]}`,
      `${FeeAmount.LOW_200}-${TICK_SPACINGS[FeeAmount.LOW_200]}`,
      `${FeeAmount.LOW_300}-${TICK_SPACINGS[FeeAmount.LOW_300]}`,
      `${FeeAmount.LOW_400}-${TICK_SPACINGS[FeeAmount.LOW_400]}`,
      `${FeeAmount.LOW}-${TICK_SPACINGS[FeeAmount.LOW]}`,
      `${FeeAmount.MEDIUM}-${TICK_SPACINGS[FeeAmount.MEDIUM]}`,
      `${FeeAmount.HIGH}-${TICK_SPACINGS[FeeAmount.HIGH]}`,
    ])
  })

  it('includes dynamic fee tier when enabled', () => {
    const result = getDefaultFeeTiersForChainWithDynamicFeeTier({
      chainId: UniverseChainId.Mainnet,
      dynamicFeeTierEnabled: true,
      protocolVersion: ProtocolVersion.V3,
    })
    expect(Object.keys(result)).toEqual([
      `${FeeAmount.LOWEST}-${TICK_SPACINGS[FeeAmount.LOWEST]}`,
      `${FeeAmount.LOW}-${TICK_SPACINGS[FeeAmount.LOW]}`,
      `${FeeAmount.MEDIUM}-${TICK_SPACINGS[FeeAmount.MEDIUM]}`,
      `${FeeAmount.HIGH}-${TICK_SPACINGS[FeeAmount.HIGH]}`,
      `${DYNAMIC_FEE_DATA.feeAmount}-${DYNAMIC_FEE_DATA.tickSpacing}`,
    ])
  })
})

describe('getDefaultFeeTiersWithData', () => {
  it('returns correct fee tiers for Mainnet (V3)', () => {
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: DEFAULT_FEE_TIERS,
      protocolVersion: ProtocolVersion.V3,
    })
    // Only fee tiers present in both defaultFeeTiers and sharedFeeTierData for Mainnet
    expect(result.map((f) => f.value.feeAmount)).toEqual([
      FeeAmount.HIGH,
      FeeAmount.MEDIUM,
      FeeAmount.LOW,
      FeeAmount.LOWEST,
    ])
  })

  it('returns correct fee tiers for Base (V3)', () => {
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Base,
      feeTierData: DEFAULT_FEE_TIERS,
      protocolVersion: ProtocolVersion.V3,
    })
    // All fee tiers present in both defaultFeeTiers and sharedFeeTierData for Base
    expect(result.map((f) => f.value.feeAmount)).toEqual([
      FeeAmount.HIGH,
      FeeAmount.MEDIUM,
      FeeAmount.LOW,
      FeeAmount.LOW_400,
      FeeAmount.LOW_300,
      FeeAmount.LOW_200,
      FeeAmount.LOWEST,
    ])
  })

  it('filters out fee tiers not in feeTierData (V3)', () => {
    const partialFeeTierData = {
      [`${FeeAmount.LOWEST}-${TICK_SPACINGS[FeeAmount.LOWEST]}`]: DEFAULT_FEE_TIERS[FeeAmount.LOWEST],
      [`${FeeAmount.LOW}-${TICK_SPACINGS[FeeAmount.LOW]}`]: DEFAULT_FEE_TIERS[FeeAmount.LOW],
    }
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: partialFeeTierData,
      protocolVersion: ProtocolVersion.V3,
    })
    expect(result.map((f) => f.value.feeAmount)).toEqual([FeeAmount.LOWEST, FeeAmount.LOW])
  })

  it('returns empty array if no fee tiers match (V3)', () => {
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: {},
      protocolVersion: ProtocolVersion.V3,
    })
    expect(result).toEqual([])
  })

  it('sorts V3 fee tiers by TVL descending', () => {
    // Use a subset of DEFAULT_FEE_TIERS with shuffled TVL
    const shuffledFeeTierData = {
      [`${FeeAmount.LOWEST}-${TICK_SPACINGS[FeeAmount.LOWEST]}`]: {
        ...DEFAULT_FEE_TIERS[FeeAmount.LOWEST],
        tvl: '300',
      },
      [`${FeeAmount.LOW}-${TICK_SPACINGS[FeeAmount.LOW]}`]: {
        ...DEFAULT_FEE_TIERS[FeeAmount.LOW],
        tvl: '100',
      },
      [`${FeeAmount.MEDIUM}-${TICK_SPACINGS[FeeAmount.MEDIUM]}`]: {
        ...DEFAULT_FEE_TIERS[FeeAmount.MEDIUM],
        tvl: '400',
      },
      [`${FeeAmount.HIGH}-${TICK_SPACINGS[FeeAmount.HIGH]}`]: {
        ...DEFAULT_FEE_TIERS[FeeAmount.HIGH],
        tvl: '200',
      },
    }
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: shuffledFeeTierData,
      protocolVersion: ProtocolVersion.V3,
    })
    // Should be sorted by TVL descending
    expect(result.map((f) => f.value.feeAmount)).toEqual([
      FeeAmount.MEDIUM, // 400
      FeeAmount.LOWEST, // 300
      FeeAmount.HIGH, // 200
      FeeAmount.LOW, // 100
    ])
  })
})

describe('getFeeTierTitle', () => {
  it('names the four old default tiers', () => {
    for (const feeAmount of [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH]) {
      expect(getFeeTierTitle(feeAmount)).not.toBe('')
    }
  })

  it('gives each new default tier the title of the old tier it pairs with', () => {
    for (const { newBps, oldBps } of DEFAULT_FEE_TIER_PAIRS) {
      expect(getFeeTierTitle(bpsToFeeAmount(newBps))).toBe(getFeeTierTitle(bpsToFeeAmount(oldBps)))
    }
  })

  it('leaves any other fee amount without a title', () => {
    expect(getFeeTierTitle(7)).toBe('')
  })

  it('titles a dynamic tier as customizable whatever its fee amount', () => {
    const dynamicTitle = getFeeTierTitle(DYNAMIC_FEE_DATA.feeAmount, true)
    expect(dynamicTitle).not.toBe('')
    // A fee amount that would otherwise name a static tier doesn't override the dynamic flag.
    expect(getFeeTierTitle(FeeAmount.MEDIUM, true)).toBe(dynamicTitle)
    expect(getFeeTierTitle(2500, true)).toBe(dynamicTitle)
  })
})

describe('isDynamicFeeTier', () => {
  it('returns true for dynamic fee data (isDynamic true)', () => {
    const dynamicFeeData = { feeAmount: 123, isDynamic: true, tickSpacing: 10 }
    expect(isDynamicFeeTier(dynamicFeeData)).toBe(true)
  })

  // The flag is the whole answer: every producer of FeeData sets it, and a fee amount alone can
  // come from user input (a typed tier, a legacy URL param) that has no business resolving here.
  it('returns false for the sentinel fee amount when the flag is off', () => {
    const feeData = { feeAmount: DYNAMIC_FEE_DATA.feeAmount, isDynamic: false, tickSpacing: 10 }
    expect(isDynamicFeeTier(feeData)).toBe(false)
  })

  it('returns false for non-dynamic fee data', () => {
    const feeData = { feeAmount: 100, isDynamic: false, tickSpacing: 10 }
    expect(isDynamicFeeTier(feeData)).toBe(false)
  })
})

describe('parseFeeDataFromUrl', () => {
  const spacing = { tickSpacing: 60 }

  it('leaves a consistent static tier untouched', () => {
    const fee = { feeAmount: 3000, isDynamic: false, ...spacing }
    expect(parseFeeDataFromUrl(fee)).toBe(fee)
  })

  // `?fee={"feeAmount":3000,"tickSpacing":60,"isDynamic":true}` parses — the schema checks shape,
  // not consistency — and the tier key would otherwise collide with the static 0.30% tile.
  it('pulls the fee amount to the sentinel when the flag says dynamic', () => {
    expect(parseFeeDataFromUrl({ feeAmount: 3000, isDynamic: true, ...spacing })).toEqual({
      feeAmount: DYNAMIC_FEE_DATA.feeAmount,
      isDynamic: true,
      ...spacing,
    })
  })

  // The mirror case: a legacy bookmark carrying the pool key's fee with no isDynamic param.
  it('sets the flag when the fee amount is the sentinel', () => {
    expect(parseFeeDataFromUrl({ feeAmount: DYNAMIC_FEE_DATA.feeAmount, isDynamic: false, ...spacing })).toEqual({
      feeAmount: DYNAMIC_FEE_DATA.feeAmount,
      isDynamic: true,
      ...spacing,
    })
  })

  // Bounded after reconciliation, not before: the flag makes the fee amount meaningless, so an
  // out-of-range fee alongside it resolves to the sentinel rather than being rejected.
  it('accepts an out-of-range fee when the flag marks it dynamic', () => {
    expect(parseFeeDataFromUrl({ feeAmount: 2_000_000, isDynamic: true, ...spacing })?.feeAmount).toBe(
      DYNAMIC_FEE_DATA.feeAmount,
    )
  })

  it('keeps the tick spacing the URL supplied', () => {
    expect(parseFeeDataFromUrl({ feeAmount: 500, isDynamic: true, tickSpacing: 200 })?.tickSpacing).toBe(200)
  })

  // Each of these reached the v4-sdk Pool constructor and tripped its fee invariant mid-render.
  it.each([
    ['at the protocol cap', { feeAmount: MAX_LP_FEE, isDynamic: false, ...spacing }],
    ['between the cap and the sentinel', { feeAmount: 2_000_000, isDynamic: false, ...spacing }],
    ['negative', { feeAmount: -500, isDynamic: false, ...spacing }],
    ['fractional', { feeAmount: 30.5, isDynamic: false, ...spacing }],
    ['NaN', { feeAmount: NaN, isDynamic: false, ...spacing }],
    ['with zero tick spacing', { feeAmount: 3000, isDynamic: false, tickSpacing: 0 }],
    ['with negative tick spacing', { feeAmount: 3000, isDynamic: false, tickSpacing: -60 }],
    ['with fractional tick spacing', { feeAmount: 3000, isDynamic: false, tickSpacing: 1.5 }],
  ])('rejects a fee %s', (_label, fee) => {
    expect(parseFeeDataFromUrl(fee)).toBeUndefined()
  })
})

describe('getCommonFeeTiersWithData', () => {
  const pool = (feeAmount: number, tickSpacing: number): FeeTierData => ({
    fee: { feeAmount, isDynamic: false, tickSpacing },
    formattedFee: `${feeAmount}`,
    totalLiquidityUsd: 5_000_000,
    percentage: new Percent(1, 100),
    created: true,
    tvl: '5000000',
  })
  const createdAmounts = (feeTierData: Record<string, FeeTierData>) =>
    getCommonFeeTiersWithData({ chainId: UniverseChainId.Mainnet, feeTierData, protocolVersion: ProtocolVersion.V4 })
      .filter((tier) => tier.created)
      .map((tier) => tier.value.feeAmount)

  it('marks a canonical tier created from a pool at a tick spacing the tier does not carry', () => {
    // The 0.30% box carries the v3 spacing (60) while the create field derives 30. Keying on the box's own
    // spacing would leave it enabled beside this pool, so CCA could still deploy a second 0.30% pool.
    expect(createdAmounts({ '3000-30': pool(FeeAmount.MEDIUM, 30) })).toEqual([FeeAmount.MEDIUM])
  })

  it('still matches a pool at the tier’s own tick spacing', () => {
    expect(createdAmounts({ '3000-60': pool(FeeAmount.MEDIUM, TICK_SPACINGS[FeeAmount.MEDIUM]) })).toEqual([
      FeeAmount.MEDIUM,
    ])
  })

  it('leaves tiers with no pool uncreated', () => {
    expect(createdAmounts({})).toEqual([])
    expect(createdAmounts({ '3000-30': { ...pool(FeeAmount.MEDIUM, 30), created: false } })).toEqual([])
  })

  it('carries the launcher-derived tick spacing on each tier value, not the v3 table’s', () => {
    // The tier value names the pool the launcher will create; its id (and the selection key built from
    // it) must use the SDK's fee-derived spacing, or the availability check tests the wrong pool.
    const tiers = getCommonFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: {},
      protocolVersion: ProtocolVersion.V4,
    })
    expect(tiers.map((tier) => [tier.value.feeAmount, tier.value.tickSpacing])).toEqual([
      [FeeAmount.LOWEST, 1],
      [FeeAmount.LOW, 5],
      [FeeAmount.MEDIUM, 30],
      [FeeAmount.HIGH, 100],
    ])
  })
})

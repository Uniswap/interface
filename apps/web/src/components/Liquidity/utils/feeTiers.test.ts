import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { DYNAMIC_FEE_DATA } from 'components/Liquidity/Create/types'
import { FeeTierData } from 'components/Liquidity/types'
import {
  calculateTickSpacingFromFeeAmount,
  getDefaultFeeTiersForChainWithDynamicFeeTier,
  getDefaultFeeTiersWithData,
  getFeeTierKey,
  isDynamicFeeTier,
  mergeFeeTiers,
} from 'components/Liquidity/utils/feeTiers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'

describe('calculateTickSpacingFromFeeAmount', () => {
  it('returns correct tick spacing for typical fee amounts', () => {
    expect(calculateTickSpacingFromFeeAmount(100)).toBe(2) // .01%
    expect(calculateTickSpacingFromFeeAmount(500)).toBe(10) // .05%
    expect(calculateTickSpacingFromFeeAmount(3000)).toBe(60) // .3%
  })

  it('rounds to nearest whole number', () => {
    expect(calculateTickSpacingFromFeeAmount(333)).toBe(7)
    expect(calculateTickSpacingFromFeeAmount(250)).toBe(5)
  })

  it('returns at least 1 for very small fee amounts', () => {
    expect(calculateTickSpacingFromFeeAmount(0.1)).toBe(1)
    expect(calculateTickSpacingFromFeeAmount(0)).toBe(1)
  })

  it('handles large fee amounts', () => {
    expect(calculateTickSpacingFromFeeAmount(10000)).toBe(200)
  })
})

describe('getFeeTierKey', () => {
  it('returns correct key', () => {
    expect(getFeeTierKey(100, false)).toBe('100')
    expect(getFeeTierKey(100, true)).toBe('100-dynamic')
  })
})

describe('mergeFeeTiers', () => {
  const formatPercent = (percent: string | number | undefined, _maxDecimals?: PercentNumberDecimals) =>
    `${Number(percent) * 100}%`
  const formattedDynamicFeeTier = 'dynamic'
  const staticFee = { feeAmount: 100, isDynamic: false, tickSpacing: 60 }
  const dynamicFee = { feeAmount: 100, isDynamic: true, tickSpacing: 60 }

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
      100: {
        ...staticFeeTierData,
        totalLiquidityUsd: 0,
        tvl: '0',
        percentage: new Percent(0, 100),
      },
    })
  })

  it('formats static and dynamic fees correctly', () => {
    const defaultFeeData = [staticFee]
    let feeTiers = { [getFeeTierKey(DYNAMIC_FEE_DATA.feeAmount, true)]: defaultDynamicFeeTierData }
    let result = mergeFeeTiers({ feeTiers, defaultFeeData, formatPercent, formattedDynamicFeeTier })
    expect(result).toEqual({
      100: {
        ...staticFeeTierData,
        totalLiquidityUsd: 0,
        tvl: '0',
        percentage: new Percent(0, 100),
      },
      [getFeeTierKey(DYNAMIC_FEE_DATA.feeAmount, true)]: defaultDynamicFeeTierData,
    })

    feeTiers = { [getFeeTierKey(dynamicFee.feeAmount, true)]: dynamicFeeTierData }
    result = mergeFeeTiers({ feeTiers, defaultFeeData, formatPercent, formattedDynamicFeeTier })
    expect(result).toEqual({
      100: {
        ...staticFeeTierData,
        totalLiquidityUsd: 0,
        tvl: '0',
        percentage: new Percent(0, 100),
      },
      [getFeeTierKey(dynamicFee.feeAmount, true)]: dynamicFeeTierData,
    })
  })

  it('merges feeTiers over defaultFeeData', () => {
    const defaultFeeData = [staticFee, dynamicFee]
    const feeTiers = { '100': { ...staticFeeTierData, totalLiquidityUsd: 999 } }
    const result = mergeFeeTiers({ feeTiers, defaultFeeData, formatPercent, formattedDynamicFeeTier })
    expect(result).toEqual({
      100: {
        ...staticFeeTierData,
        totalLiquidityUsd: 999,
      },
      [getFeeTierKey(dynamicFee.feeAmount, true)]: {
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
  [FeeAmount.LOWEST]: {
    fee: { feeAmount: FeeAmount.LOWEST, isDynamic: false, tickSpacing: 1 },
    formattedFee: '0.01%',
    totalLiquidityUsd: 100,
    percentage: new Percent(1, 100),
    created: true,
    tvl: '100',
  },
  [FeeAmount.LOW_200]: {
    fee: { feeAmount: FeeAmount.LOW_200, isDynamic: false, tickSpacing: 2 },
    formattedFee: '0.02%',
    totalLiquidityUsd: 200,
    percentage: new Percent(2, 100),
    created: true,
    tvl: '200',
  },
  [FeeAmount.LOW_300]: {
    fee: { feeAmount: FeeAmount.LOW_300, isDynamic: false, tickSpacing: 3 },
    formattedFee: '0.03%',
    totalLiquidityUsd: 300,
    percentage: new Percent(3, 100),
    created: true,
    tvl: '300',
  },
  [FeeAmount.LOW_400]: {
    fee: { feeAmount: FeeAmount.LOW_400, isDynamic: false, tickSpacing: 4 },
    formattedFee: '0.04%',
    totalLiquidityUsd: 400,
    percentage: new Percent(4, 100),
    created: true,
    tvl: '400',
  },
  [FeeAmount.LOW]: {
    fee: { feeAmount: FeeAmount.LOW, isDynamic: false, tickSpacing: 5 },
    formattedFee: '0.05%',
    totalLiquidityUsd: 500,
    percentage: new Percent(5, 100),
    created: true,
    tvl: '500',
  },
  [FeeAmount.MEDIUM]: {
    fee: { feeAmount: FeeAmount.MEDIUM, isDynamic: false, tickSpacing: 6 },
    formattedFee: '0.3%',
    totalLiquidityUsd: 600,
    percentage: new Percent(6, 100),
    created: true,
    tvl: '600',
  },
  [FeeAmount.HIGH]: {
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
      FeeAmount.LOWEST.toString(),
      FeeAmount.LOW.toString(),
      FeeAmount.MEDIUM.toString(),
      FeeAmount.HIGH.toString(),
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
      FeeAmount.LOWEST.toString(),
      FeeAmount.LOW_200.toString(),
      FeeAmount.LOW_300.toString(),
      FeeAmount.LOW_400.toString(),
      FeeAmount.LOW.toString(),
      FeeAmount.MEDIUM.toString(),
      FeeAmount.HIGH.toString(),
    ])
  })

  it('includes dynamic fee tier when enabled', () => {
    const result = getDefaultFeeTiersForChainWithDynamicFeeTier({
      chainId: UniverseChainId.Mainnet,
      dynamicFeeTierEnabled: true,
      protocolVersion: ProtocolVersion.V3,
    })
    expect(Object.keys(result)).toEqual([
      FeeAmount.LOWEST.toString(),
      FeeAmount.LOW.toString(),
      FeeAmount.MEDIUM.toString(),
      FeeAmount.HIGH.toString(),
      DYNAMIC_FEE_DATA.feeAmount.toString(),
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
    expect(result.map((f) => f.tier)).toEqual([FeeAmount.HIGH, FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.LOWEST])
  })

  it('returns correct fee tiers for Base (V3)', () => {
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Base,
      feeTierData: DEFAULT_FEE_TIERS,
      protocolVersion: ProtocolVersion.V3,
    })
    // All fee tiers present in both defaultFeeTiers and sharedFeeTierData for Base
    expect(result.map((f) => f.tier)).toEqual([
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
      [FeeAmount.LOWEST]: DEFAULT_FEE_TIERS[FeeAmount.LOWEST],
      [FeeAmount.LOW]: DEFAULT_FEE_TIERS[FeeAmount.LOW],
    }
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: partialFeeTierData,
      protocolVersion: ProtocolVersion.V3,
    })
    expect(result.map((f) => f.tier)).toEqual([FeeAmount.LOW, FeeAmount.LOWEST])
  })

  it('returns empty array if no fee tiers match (V3)', () => {
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: {},
      protocolVersion: ProtocolVersion.V3,
    })
    expect(result).toEqual([])
  })

  it('returns top 8 fee tiers sorted by TVL for V4', () => {
    // Create 10 fee tiers with descending TVL
    const v4FeeTierData: Record<number, FeeTierData> = {}
    for (let i = 0; i < 10; i++) {
      v4FeeTierData[1000 + i] = {
        fee: { feeAmount: 1000 + i, isDynamic: false, tickSpacing: i },
        formattedFee: `${i}%`,
        totalLiquidityUsd: 1000 + i,
        percentage: new Percent(i, 100),
        created: true,
        tvl: `${1000 + i}`,
      }
    }
    // Shuffle TVL values to test sorting
    v4FeeTierData[1005].tvl = '2000'
    v4FeeTierData[1006].tvl = '3000'
    v4FeeTierData[1007].tvl = '4000'
    v4FeeTierData[1008].tvl = '5000'
    v4FeeTierData[1009].tvl = '6000'

    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Base,
      feeTierData: v4FeeTierData,
      protocolVersion: ProtocolVersion.V4,
    })
    // Should return top 8 by TVL, sorted descending
    const sortedTiers = Object.entries(v4FeeTierData)
      .sort((a, b) => parseFloat(b[1].tvl) - parseFloat(a[1].tvl))
      .slice(0, 4)
      .map(([feeAmount]) => Number(feeAmount))
    expect(result.map((f) => f.tier)).toEqual(sortedTiers)
  })

  it('sorts V3 fee tiers by TVL descending', () => {
    // Use a subset of DEFAULT_FEE_TIERS with shuffled TVL
    const shuffledFeeTierData = {
      [FeeAmount.LOWEST]: { ...DEFAULT_FEE_TIERS[FeeAmount.LOWEST], tvl: '300' },
      [FeeAmount.LOW]: { ...DEFAULT_FEE_TIERS[FeeAmount.LOW], tvl: '100' },
      [FeeAmount.MEDIUM]: { ...DEFAULT_FEE_TIERS[FeeAmount.MEDIUM], tvl: '400' },
      [FeeAmount.HIGH]: { ...DEFAULT_FEE_TIERS[FeeAmount.HIGH], tvl: '200' },
    }
    const result = getDefaultFeeTiersWithData({
      chainId: UniverseChainId.Mainnet,
      feeTierData: shuffledFeeTierData,
      protocolVersion: ProtocolVersion.V3,
    })
    // Should be sorted by TVL descending
    expect(result.map((f) => f.tier)).toEqual([
      FeeAmount.MEDIUM, // 400
      FeeAmount.LOWEST, // 300
      FeeAmount.HIGH, // 200
      FeeAmount.LOW, // 100
    ])
  })
})

describe('isDynamicFeeTier', () => {
  it('returns true for dynamic fee data (isDynamic true)', () => {
    const dynamicFeeData = { feeAmount: 123, isDynamic: true, tickSpacing: 10 }
    expect(isDynamicFeeTier(dynamicFeeData)).toBe(true)
  })

  it('returns true for fee data with DYNAMIC_FEE_DATA.feeAmount', () => {
    const feeData = { feeAmount: DYNAMIC_FEE_DATA.feeAmount, isDynamic: false, tickSpacing: 10 }
    expect(isDynamicFeeTier(feeData)).toBe(true)
  })

  it('returns false for non-dynamic fee data', () => {
    const feeData = { feeAmount: 100, isDynamic: false, tickSpacing: 10 }
    expect(isDynamicFeeTier(feeData)).toBe(false)
  })
})

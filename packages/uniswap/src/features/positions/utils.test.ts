import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { TickMath } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import {
  filterAndSortPositions,
  getExactSharePercent,
  getFeeLabel,
  getIsPermissioned,
  getPositionKey,
  getProtocolVersionLabel,
  sortPositionsByStatusClosedLast,
  toLiquidityChainId,
} from 'uniswap/src/features/positions/utils'
import { describe, expect, it } from 'vitest'

describe('getPositionKey', () => {
  it('joins poolId, tokenId, and chainId with dashes', () => {
    expect(
      getPositionKey({
        poolId: '0xpool',
        tokenId: '1234',
        chainId: UniverseChainId.Mainnet,
      } as Pick<PositionInfo, 'poolId' | 'tokenId' | 'chainId'>),
    ).toBe(`0xpool-1234-${UniverseChainId.Mainnet}`)
  })

  it('coerces a missing V2 tokenId to empty string', () => {
    expect(
      getPositionKey({
        poolId: '0xpool',
        tokenId: undefined,
        chainId: UniverseChainId.Base,
      } as Pick<PositionInfo, 'poolId' | 'tokenId' | 'chainId'>),
    ).toBe(`0xpool--${UniverseChainId.Base}`)
  })
})

describe('getProtocolVersionLabel', () => {
  it('returns lowercase version strings for V2/V3/V4', () => {
    expect(getProtocolVersionLabel(ProtocolVersion.V2)).toBe('v2')
    expect(getProtocolVersionLabel(ProtocolVersion.V3)).toBe('v3')
    expect(getProtocolVersionLabel(ProtocolVersion.V4)).toBe('v4')
  })

  it('returns undefined for UNSPECIFIED', () => {
    expect(getProtocolVersionLabel(ProtocolVersion.UNSPECIFIED)).toBeUndefined()
  })

  // Sanity check the function gracefully handles enum members it doesn't know about — the
  // upstream proto can add new versions before we update this switch.
  it('returns undefined for an unknown ProtocolVersion value', () => {
    expect(getProtocolVersionLabel(999 as ProtocolVersion)).toBeUndefined()
  })
})

describe('sortPositionsByStatusClosedLast', () => {
  const position = (poolId: string, status: PositionStatus): PositionInfo =>
    ({ poolId, status }) as unknown as PositionInfo

  it('moves closed positions to the end while preserving order of the rest', () => {
    const positions = [
      position('closed-1', PositionStatus.CLOSED),
      position('open-1', PositionStatus.IN_RANGE),
      position('open-2', PositionStatus.OUT_OF_RANGE),
      position('closed-2', PositionStatus.CLOSED),
    ]

    expect(sortPositionsByStatusClosedLast(positions).map((p) => p.poolId)).toEqual([
      'open-1',
      'open-2',
      'closed-1',
      'closed-2',
    ])
  })

  it('does not mutate the input array', () => {
    const positions = [position('closed', PositionStatus.CLOSED), position('open', PositionStatus.IN_RANGE)]
    const original = [...positions]

    sortPositionsByStatusClosedLast(positions)

    expect(positions).toEqual(original)
  })
})

describe('filterAndSortPositions', () => {
  const position = (poolId: string, status: PositionStatus): PositionInfo =>
    ({ poolId, status }) as unknown as PositionInfo

  it('keeps only positions whose status is in the given list', () => {
    const positions = [
      position('open', PositionStatus.IN_RANGE),
      position('closed', PositionStatus.CLOSED),
      position('out-of-range', PositionStatus.OUT_OF_RANGE),
    ]

    expect(
      filterAndSortPositions(positions, [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE]).map((p) => p.poolId),
    ).toEqual(['open', 'out-of-range'])
  })

  it('filters to the given statuses and sorts closed positions last', () => {
    const positions = [
      position('closed-1', PositionStatus.CLOSED),
      position('open-1', PositionStatus.IN_RANGE),
      position('out-of-range', PositionStatus.OUT_OF_RANGE),
      position('closed-2', PositionStatus.CLOSED),
    ]

    expect(
      filterAndSortPositions(positions, [
        PositionStatus.IN_RANGE,
        PositionStatus.OUT_OF_RANGE,
        PositionStatus.CLOSED,
      ]).map((p) => p.poolId),
    ).toEqual(['open-1', 'out-of-range', 'closed-1', 'closed-2'])
  })
})

describe('getFeeLabel', () => {
  const dynamicLabel = 'Dynamic'

  it('returns the dynamic label when feeTier.isDynamic is true', () => {
    expect(
      getFeeLabel({
        version: ProtocolVersion.V4,
        feeTier: { feeAmount: 8388608, tickSpacing: 60, isDynamic: true },
        dynamicLabel,
      }),
    ).toBe('Dynamic')
  })

  it('formats a static feeTier as a percentage of BIPS_BASE', () => {
    // 500 / 10_000 = 0.05 → "0.05%"
    expect(
      getFeeLabel({
        version: ProtocolVersion.V3,
        feeTier: { feeAmount: 500, tickSpacing: 10, isDynamic: false },
        dynamicLabel,
      }),
    ).toBe('0.05%')

    // 3000 / 10_000 = 0.3 → "0.3%"
    expect(
      getFeeLabel({
        version: ProtocolVersion.V4,
        feeTier: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
        dynamicLabel,
      }),
    ).toBe('0.3%')
  })

  it('falls back to the V2 default fee tier when feeTier is missing on V2', () => {
    // V2_DEFAULT_FEE_TIER = 3000 → "0.3%"
    expect(getFeeLabel({ version: ProtocolVersion.V2, dynamicLabel })).toBe('0.3%')
  })

  it('returns undefined when feeTier is missing on V3/V4', () => {
    expect(getFeeLabel({ version: ProtocolVersion.V3, dynamicLabel })).toBeUndefined()
    expect(getFeeLabel({ version: ProtocolVersion.V4, dynamicLabel })).toBeUndefined()
  })
})

describe('getIsPermissioned', () => {
  it('passes through the isPermissioned flag for V4 positions', () => {
    expect(getIsPermissioned({ version: ProtocolVersion.V4, isPermissioned: true } as PositionInfo)).toBe(true)
    expect(getIsPermissioned({ version: ProtocolVersion.V4, isPermissioned: false } as PositionInfo)).toBe(false)
  })

  it('returns undefined for a V4 position missing the flag', () => {
    expect(getIsPermissioned({ version: ProtocolVersion.V4 } as PositionInfo)).toBeUndefined()
  })

  it('returns undefined for non-V4 positions', () => {
    expect(getIsPermissioned({ version: ProtocolVersion.V3 } as PositionInfo)).toBeUndefined()
    expect(getIsPermissioned({ version: ProtocolVersion.V2 } as PositionInfo)).toBeUndefined()
  })
})

// LP-1564: a pool row served with its price pinned to the bottom of the tick range makes token0
// worth ~1e-39 raw token1 units, so a position holding only token0 is worth a positive fraction of
// a single raw token1 unit. Values are from the reported wallet: V4 tokenId 1039089, Base ETH/USDC.
describe('getExactSharePercent', () => {
  const usdcBase = new Token(8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC', 'USD Coin')
  const degeneratePool = new V4Pool(
    nativeOnChain(8453),
    usdcBase,
    30,
    1,
    ZERO_ADDRESS,
    TickMath.getSqrtRatioAtTick(TickMath.MIN_TICK),
    '0',
    TickMath.MIN_TICK,
  )
  const dustPosition = new V4Position({
    pool: degeneratePool,
    liquidity: '612822055934',
    tickLower: -198100,
    tickUpper: -195750,
  })
  const value0 = degeneratePool.token0Price.quote(dustPosition.amount0)
  const value1 = dustPosition.amount1
  const totalValue = value0.add(value1)

  it('values the whole position above zero but below one raw unit of token1', () => {
    expect(totalValue.greaterThan(0)).toBe(true)
    expect(totalValue.quotient.toString()).toBe('0')
  })

  it('throws when the same split is taken on the floored quotients', () => {
    expect(() => new Percent(value0.quotient, totalValue.quotient).toFixed(2)).toThrow('[big.js] Division by zero')
  })

  it('splits a sub-base-unit total exactly', () => {
    // Below tickLower the position is entirely token0.
    expect(getExactSharePercent(value0, totalValue)?.toFixed(2)).toBe('100.00')
    expect(getExactSharePercent(value1, totalValue)?.toFixed(2)).toBe('0.00')
  })

  it('matches the floored split when the total is comfortably above one base unit', () => {
    const whole0 = CurrencyAmount.fromRawAmount(usdcBase, '3000000')
    const whole1 = CurrencyAmount.fromRawAmount(usdcBase, '1000000')
    const wholeTotal = whole0.add(whole1)

    expect(getExactSharePercent(whole0, wholeTotal)?.toFixed(2)).toBe('75.00')
    expect(getExactSharePercent(whole1, wholeTotal)?.toFixed(2)).toBe('25.00')
  })

  // The precondition is enforced, not just documented: `Fraction.divide` puts the divisor's
  // numerator in the denominator, so a caller that skipped the `total.greaterThan(0)` check would
  // otherwise rebuild the `Percent(_, 0)` this helper exists to prevent.
  it('returns undefined for a zero total instead of building a zero denominator', () => {
    const zero = CurrencyAmount.fromRawAmount(usdcBase, 0)
    expect(getExactSharePercent(zero, zero)).toBeUndefined()
    expect(getExactSharePercent(CurrencyAmount.fromRawAmount(usdcBase, '1000000'), zero)).toBeUndefined()
  })

  it('returns undefined for a negative total', () => {
    const negative = CurrencyAmount.fromRawAmount(usdcBase, '1000000').multiply(-1)
    expect(getExactSharePercent(CurrencyAmount.fromRawAmount(usdcBase, '1000000'), negative)).toBeUndefined()
  })
})

describe('toLiquidityChainId', () => {
  it('maps a chain the liquidity enum models', () => {
    expect(toLiquidityChainId(UniverseChainId.Mainnet)).toBe(UniverseChainId.Mainnet)
  })

  it('maps Elysium even though the liquidity enum lacks it', () => {
    expect(toLiquidityChainId(UniverseChainId.Elysium)).toBe(99901)
  })

  it('drops undefined and chains the liquidity service does not model', () => {
    expect(toLiquidityChainId(undefined)).toBeUndefined()
    expect(toLiquidityChainId(123456789)).toBeUndefined()
  })
})

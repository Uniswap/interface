import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import {
  getDependentAmountFromV2Pair,
  getDependentAmountFromV3Position,
  getDependentAmountFromV4Position,
  isImpossibleDependentAmount,
} from '~/features/Liquidity/utils/getDependentAmount'
import { PositionField } from '~/types/position'

// Deliberately not ~/test-utils/constants: importing it constructs ClassicTrade fixtures,
// pulling the entire routing stack into this pure-utils suite.
const ETH_MAINNET = nativeOnChain(UniverseChainId.Mainnet)
const WETH = ETH_MAINNET.wrapped
const tickSpaceLimits = [
  nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
  nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
]

// A tight WETH/USDT range three spacings wide, and pools priced exactly on each of its edges. WETH sorts
// before USDT, so WETH is token0.
const TIGHT_TICK_LOWER = -194160
const TIGHT_TICK_UPPER = -193980
const POOL_LIQUIDITY = '6661209530036967407'
const MAX_UINT_256 = (1n << 256n) - 1n

function v3PoolAtTick(tick: number): V3Pool {
  return new V3Pool(WETH, USDT, FeeAmount.MEDIUM, TickMath.getSqrtRatioAtTick(tick), POOL_LIQUIDITY, tick)
}

function v4PoolAtTick(tick: number): V4Pool {
  return new V4Pool(
    ETH_MAINNET,
    USDT,
    FeeAmount.MEDIUM,
    TICK_SPACINGS[FeeAmount.MEDIUM],
    ZERO_ADDRESS,
    TickMath.getSqrtRatioAtTick(tick),
    POOL_LIQUIDITY,
    tick,
  )
}

describe('getDependentAmountFromV2Pair', () => {
  it('returns undefined', () => {
    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
        pair: new Pair(
          CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        ),
        exactField: PositionField.TOKEN0,
        token0: undefined,
        token1: undefined,
        dependentToken: undefined,
      }),
    ).toBeUndefined()

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
        pair: undefined,
        exactField: PositionField.TOKEN0,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: USDT,
      }),
    ).toBeUndefined()

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: undefined,
        pair: new Pair(
          CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        ),
        exactField: PositionField.TOKEN0,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: undefined,
      }),
    ).toBeUndefined()
  })

  it('returns dependent amount', () => {
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
      CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
    )

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        pair,
        exactField: PositionField.TOKEN1,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: USDT,
      }),
    ).toEqual(
      pair.priceOf(ETH_MAINNET.wrapped).quote(CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000')),
    )

    expect(
      getDependentAmountFromV2Pair({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
        pair,
        exactField: PositionField.TOKEN0,
        token0: USDT,
        token1: ETH_MAINNET,
        dependentToken: USDT,
      }),
    ).toEqual(pair.priceOf(USDT.wrapped).quote(CurrencyAmount.fromRawAmount(USDT, '1000000000000000000')))
  })
})

describe('getDependentAmountFromV3Position', () => {
  it('returns dependent amount', () => {
    const pool = new V3Pool(WETH, USDT, FeeAmount.MEDIUM, '4862546267419838844180017', '6661209530036967407', -193981)

    expect(
      getDependentAmountFromV3Position({
        independentAmount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[0],
        tickUpper: tickSpaceLimits[1],
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDT, '3766763261'))
  })

  it('should return undefined instead of throwing when tickLower equals tickUpper', () => {
    const pool = new V3Pool(WETH, USDT, FeeAmount.MEDIUM, '4862546267419838844180017', '6661209530036967407', -193981)

    expect(
      getDependentAmountFromV3Position({
        independentAmount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[0],
        tickUpper: tickSpaceLimits[0],
      }),
    ).toBeUndefined()
  })

  it('should return undefined instead of throwing when ticks are inverted', () => {
    const pool = new V3Pool(WETH, USDT, FeeAmount.MEDIUM, '4862546267419838844180017', '6661209530036967407', -193981)

    expect(
      getDependentAmountFromV3Position({
        independentAmount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[1],
        tickUpper: tickSpaceLimits[0],
      }),
    ).toBeUndefined()
  })
})

describe('getDependentAmountFromV3Position at a tight range edge', () => {
  it('returns zero, not ~MaxUint256, when the price reaches the upper edge and token0 is independent', () => {
    expect(
      getDependentAmountFromV3Position({
        independentAmount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
        pool: v3PoolAtTick(TIGHT_TICK_UPPER),
        tickLower: TIGHT_TICK_LOWER,
        tickUpper: TIGHT_TICK_UPPER,
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDT, 0))
  })

  it('returns zero when the price is above the range and token0 is independent', () => {
    expect(
      getDependentAmountFromV3Position({
        independentAmount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
        pool: v3PoolAtTick(TIGHT_TICK_UPPER + 1),
        tickLower: TIGHT_TICK_LOWER,
        tickUpper: TIGHT_TICK_UPPER,
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDT, 0))
  })

  it('returns zero, not ~MaxUint256, when the price sits on the lower edge and token1 is independent', () => {
    expect(
      getDependentAmountFromV3Position({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000'),
        pool: v3PoolAtTick(TIGHT_TICK_LOWER),
        tickLower: TIGHT_TICK_LOWER,
        tickUpper: TIGHT_TICK_UPPER,
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(WETH, 0))
  })

  it('still prices a real dependent amount one tick inside the upper edge', () => {
    const dependent = getDependentAmountFromV3Position({
      independentAmount: CurrencyAmount.fromRawAmount(WETH, '1000000000000000000'),
      pool: v3PoolAtTick(TIGHT_TICK_UPPER - 1),
      tickLower: TIGHT_TICK_LOWER,
      tickUpper: TIGHT_TICK_UPPER,
    })

    expect(dependent?.currency.equals(USDT)).toBe(true)
    const raw = BigInt(dependent?.quotient.toString() ?? '0')
    // Nearly all of the range is below the price, so 1 WETH pairs with a large but finite USDT amount.
    expect(raw).toBeGreaterThan(0n)
    expect(raw).toBeLessThan(10n ** 18n)
  })
})

describe('getDependentAmountFromV4Position', () => {
  it('returns zero, not ~MaxUint256, when the price reaches the upper edge and token0 is independent', () => {
    expect(
      getDependentAmountFromV4Position({
        independentAmount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        pool: v4PoolAtTick(TIGHT_TICK_UPPER),
        tickLower: TIGHT_TICK_LOWER,
        tickUpper: TIGHT_TICK_UPPER,
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDT, 0))
  })

  it('returns zero when the price sits on the lower edge and token1 is independent', () => {
    expect(
      getDependentAmountFromV4Position({
        independentAmount: CurrencyAmount.fromRawAmount(USDT, '1000000000'),
        pool: v4PoolAtTick(TIGHT_TICK_LOWER),
        tickLower: TIGHT_TICK_LOWER,
        tickUpper: TIGHT_TICK_UPPER,
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(ETH_MAINNET, 0))
  })

  it('returns dependent amount', () => {
    const pool = new V4Pool(
      ETH_MAINNET,
      USDT,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      '4862546267419838844180017',
      '6661209530036967407',
      -193981,
    )

    expect(
      getDependentAmountFromV4Position({
        independentAmount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[0],
        tickUpper: tickSpaceLimits[1],
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDT, '3766763261'))
  })

  it('should return undefined instead of throwing when tickLower equals tickUpper', () => {
    // Repro for ECO-610: min price == max price produces equal ticks; the SDK's
    // maxLiquidityForAmounts divides by (sqrtRatioB - sqrtRatioA) == 0 and crashed the app.
    const pool = new V4Pool(
      ETH_MAINNET,
      USDT,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      '4862546267419838844180017',
      '6661209530036967407',
      -193981,
    )

    expect(
      getDependentAmountFromV4Position({
        independentAmount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[0],
        tickUpper: tickSpaceLimits[0],
      }),
    ).toBeUndefined()
  })

  it('should return undefined instead of throwing when ticks are inverted', () => {
    const pool = new V4Pool(
      ETH_MAINNET,
      USDT,
      FeeAmount.MEDIUM,
      TICK_SPACINGS[FeeAmount.MEDIUM],
      ZERO_ADDRESS,
      '4862546267419838844180017',
      '6661209530036967407',
      -193981,
    )

    expect(
      getDependentAmountFromV4Position({
        independentAmount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        pool,
        tickLower: tickSpaceLimits[1],
        tickUpper: tickSpaceLimits[0],
      }),
    ).toBeUndefined()
  })
})

describe('isImpossibleDependentAmount', () => {
  it('flags the SDK MaxUint256 placeholder', () => {
    expect(isImpossibleDependentAmount(MAX_UINT_256.toString())).toBe(true)
  })

  it('flags anything past uint128', () => {
    expect(isImpossibleDependentAmount((1n << 128n).toString())).toBe(true)
  })

  it('accepts real amounts up to uint128', () => {
    expect(isImpossibleDependentAmount(((1n << 128n) - 1n).toString())).toBe(false)
    expect(isImpossibleDependentAmount('3766763261')).toBe(false)
    expect(isImpossibleDependentAmount('0')).toBe(false)
  })

  it('treats a missing amount as nothing to reject', () => {
    expect(isImpossibleDependentAmount(undefined)).toBe(false)
  })

  it('flags an unparseable amount', () => {
    expect(isImpossibleDependentAmount('not-a-number')).toBe(true)
  })
})

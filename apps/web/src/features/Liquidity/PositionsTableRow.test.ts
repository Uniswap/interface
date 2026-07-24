import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI } from 'uniswap/src/constants/tokens'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'
import { describe, expect, it } from 'vitest'
import { getPositionValueDistribution } from '~/features/Liquidity/PositionsTableRow'

const ONE_UNIT = '1000000000000000000'
const TWO_UNITS = '2000000000000000000'
const THREE_UNITS = '3000000000000000000'
const THREE_THOUSAND_DAI = '3000000000000000000000'
const ZERO = '0'

const SQRT_PRICE_1_1 = TickMath.getSqrtRatioAtTick(0)

function expectSplit(
  distribution: ReturnType<typeof getPositionValueDistribution>,
  percent0: string,
  percent1: string,
  markerPosition: number,
): void {
  expect(distribution?.percent0.toFixed(2)).toBe(percent0)
  expect(distribution?.percent1.toFixed(2)).toBe(percent1)
  expect(distribution?.markerPosition).toBe(markerPosition)
}

const concentratedPools: [string, V3Pool | V4Pool][] = [
  ['V3', new V3Pool(WETH, DAI, FeeAmount.MEDIUM, SQRT_PRICE_1_1, ONE_UNIT, 0)],
  [
    'V4',
    new V4Pool(WETH, DAI, FeeAmount.MEDIUM, TICK_SPACINGS[FeeAmount.MEDIUM], ZERO_ADDRESS, SQRT_PRICE_1_1, ONE_UNIT, 0),
  ],
]

describe('getPositionValueDistribution', () => {
  it('treats a V2 pair as 50/50 by value regardless of reserve ratio', () => {
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(WETH, ONE_UNIT),
      CurrencyAmount.fromRawAmount(DAI, THREE_THOUSAND_DAI),
    )

    expectSplit(
      getPositionValueDistribution({
        currency0Amount: pair.reserve0,
        currency1Amount: pair.reserve1,
        poolOrPair: pair,
      }),
      '50.00',
      '50.00',
      0.5,
    )
  })

  describe.each(concentratedPools)('%s', (_label, pool) => {
    const distribute = (raw0: string, raw1: string): ReturnType<typeof getPositionValueDistribution> =>
      getPositionValueDistribution({
        currency0Amount: CurrencyAmount.fromRawAmount(pool.token0, raw0),
        currency1Amount: CurrencyAmount.fromRawAmount(pool.token1, raw1),
        poolOrPair: pool,
      })

    it('splits 50/50 when both tokens hold equal value', () => {
      expectSplit(distribute(ONE_UNIT, ONE_UNIT), '50.00', '50.00', 0.5)
    })

    it('weights by pool price for an unequal split', () => {
      expectSplit(distribute(THREE_UNITS, ONE_UNIT), '75.00', '25.00', 0.75)
    })

    it('returns 100% token0 when out of range below the position', () => {
      expectSplit(distribute(ONE_UNIT, ZERO), '100.00', '0.00', 1)
    })

    it('returns 100% token1 when out of range above the position', () => {
      expectSplit(distribute(ZERO, TWO_UNITS), '0.00', '100.00', 0)
    })

    it('returns undefined for an empty position', () => {
      expect(distribute(ZERO, ZERO)).toBeUndefined()
    })
  })
})

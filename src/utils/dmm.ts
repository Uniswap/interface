import { Fraction, JSBI, Price, Pair } from 'libs/sdk/src'
import { ZERO, ONE } from 'libs/sdk/src/constants'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum } from 'utils'

export function priceRangeCalc(price?: Price | Fraction, amp?: Fraction): [Fraction | undefined, Fraction | undefined] {
  //Ex amp = 1.23456
  if (amp && (amp.equalTo(ONE) || amp?.equalTo(ZERO))) return [undefined, undefined]
  const temp = amp?.divide(amp?.subtract(JSBI.BigInt(1)))
  if (!amp || !temp || !price) return [undefined, undefined]
  return [
    (price as Price)?.adjusted.multiply(temp).multiply(temp),
    (price as Price)?.adjusted.divide(temp.multiply(temp))
  ]
}

/**
 * Get health factor (F) of a pool
 */
export function getHealthFactor(pool: Pair): Fraction {
  return pool.reserve0.multiply(pool.reserve1)
}

function getToken0MinPrice(pool: Pair): Fraction {
  const temp = pool.virtualReserve1.subtract(pool.reserve1)
  return temp
    .multiply(temp)
    .divide(pool.virtualReserve0)
    .divide(pool.virtualReserve1)
}

function getToken0MaxPrice(pool: Pair): Fraction {
  const temp = pool.virtualReserve0.subtract(pool.reserve0)
  return pool.virtualReserve0
    .multiply(pool.virtualReserve1)
    .divide(temp)
    .divide(temp)
}

function getToken1MinPrice(pool: Pair): Fraction {
  const temp = pool.virtualReserve0.subtract(pool.reserve0)
  return temp
    .multiply(temp)
    .divide(pool.virtualReserve0)
    .divide(pool.virtualReserve1)
}

function getToken1MaxPrice(pool: Pair): Fraction {
  const temp = pool.virtualReserve1.subtract(pool.reserve1)
  return pool.virtualReserve0
    .multiply(pool.virtualReserve1)
    .divide(temp)
    .divide(temp)
}

export const priceRangeCalcByPair = (pair?: Pair): [Fraction | undefined, Fraction | undefined][] => {
  //Ex amp = 1.23456
  if (!pair || new Fraction(pair.amp).equalTo(JSBI.BigInt(10000)))
    return [
      [undefined, undefined],
      [undefined, undefined]
    ]
  return [
    [getToken0MinPrice(pair), getToken0MaxPrice(pair)],
    [getToken1MinPrice(pair), getToken1MaxPrice(pair)]
  ]
}

const DEFAULT_MY_LIQUIDITY = '-'

export const getMyLiquidity = (liquidityPosition?: UserLiquidityPosition): string | 0 => {
  if (!liquidityPosition || parseFloat(liquidityPosition.liquidityTokenTotalSupply) === 0) {
    return DEFAULT_MY_LIQUIDITY
  }

  const myLiquidity =
    (parseFloat(liquidityPosition.liquidityTokenBalance) * parseFloat(liquidityPosition.reserveUSD)) /
    parseFloat(liquidityPosition.liquidityTokenTotalSupply)

  if (myLiquidity === 0) {
    return DEFAULT_MY_LIQUIDITY
  }

  return formattedNum(myLiquidity.toString(), true)
}

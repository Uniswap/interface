import { BigNumber } from '@ethersproject/bignumber'

import { Fraction, JSBI, Price, Pair, Token } from 'libs/sdk/src'
import { ZERO, ONE } from 'libs/sdk/src/constants'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum } from 'utils'

import {
  Currency as CurrencySUSHI,
  TokenAmount as TokenAmountSUSHI,
  Token as TokenSUSHI,
  ChainId as ChainIdSUSHI
} from '@sushiswap/sdk'
import {
  Currency as CurrencyDMM,
  Token as TokenDMM,
  TokenAmount as TokenAmountDMM,
  ChainId as ChainIdDMM
} from 'libs/sdk/src'
import { BLOCKS_PER_YEAR } from '../constants'

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

export const feeRangeCalc = (amp: number): string => {
  let baseFee = 0
  if (amp > 20) baseFee = 4
  if (amp <= 20 && amp > 5) baseFee = 10
  if (amp <= 5 && amp > 2) baseFee = 20
  if (amp <= 2) baseFee = 30

  return `${(baseFee / 2 / 100).toPrecision()}% - ${((baseFee * 2) / 100).toPrecision()}%`
}

const DEFAULT_MY_LIQUIDITY = '-'

export const getMyLiquidity = (liquidityPosition?: UserLiquidityPosition): string | 0 => {
  if (!liquidityPosition || parseFloat(liquidityPosition.pool.totalSupply) === 0) {
    return DEFAULT_MY_LIQUIDITY
  }

  const myLiquidity =
    (parseFloat(liquidityPosition.liquidityTokenBalance) * parseFloat(liquidityPosition.pool.reserveUSD)) /
    parseFloat(liquidityPosition.pool.totalSupply)

  if (myLiquidity === 0) {
    return DEFAULT_MY_LIQUIDITY
  }

  return formattedNum(myLiquidity.toString(), true)
}

export function tokenSushiToDmm(tokenSushi: TokenSUSHI): TokenDMM {
  return new TokenDMM(
    tokenSushi.chainId as ChainIdDMM,
    tokenSushi.address,
    tokenSushi.decimals,
    tokenSushi.symbol,
    tokenSushi.name
  )
}
export function tokenDmmToSushi(tokenDmm: TokenDMM): TokenSUSHI {
  return new TokenSUSHI(
    tokenDmm.chainId as ChainIdSUSHI,
    tokenDmm.address,
    tokenDmm.decimals,
    tokenDmm.symbol,
    tokenDmm.name
  )
}

export function tokenAmountDmmToSushi(amount: TokenAmountDMM): TokenAmountSUSHI {
  return new TokenAmountSUSHI(
    new TokenSUSHI(
      amount.token.chainId as ChainIdSUSHI,
      amount.token.address,
      amount.token.decimals,
      amount.token.symbol,
      amount.token.name
    ),
    amount.raw
  )
}

/**
 * Get farm APR value in %
 * @param kncPriceUsd KNC price in USD
 * @param poolLiquidityUsd Total pool liquidity in USD
 * @returns
 */
export function getFarmApr(
  rewardToken: Token,
  rewardPerBlock: BigNumber,
  kncPriceUsd: string,
  poolLiquidityUsd: string
): number {
  if (parseFloat(poolLiquidityUsd) === 0) {
    return 0
  }

  const rewardPerBlockAmount = new TokenAmountDMM(rewardToken, rewardPerBlock.toString())

  const yearlyKNCRewardAllocation = parseFloat(rewardPerBlockAmount.toSignificant(6)) * BLOCKS_PER_YEAR
  const apr = ((yearlyKNCRewardAllocation * parseFloat(kncPriceUsd)) / parseFloat(poolLiquidityUsd)) * 100

  return apr
}

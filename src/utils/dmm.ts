import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { Pair } from '@kyberswap/ks-sdk-classic'
import { ChainId, Currency, CurrencyAmount, Fraction, Price, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { BLOCKS_PER_YEAR, SECONDS_PER_YEAR, ZERO_ADDRESS } from 'constants/index'
import { EVM_NETWORK } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { useBlockNumber } from 'state/application/hooks'
import { useActiveAndUniqueFarmsData, useRewardTokenPrices, useRewardTokens } from 'state/farms/hooks'
import { Farm, Reward, RewardPerTimeUnit } from 'state/farms/types'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { formattedNum } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { getFullDisplayBalance } from './formatBalance'

export function priceRangeCalc(
  price?: Price<Currency, Currency> | Fraction,
  amp?: Fraction,
): [Fraction | undefined, Fraction | undefined] {
  //Ex amp = 1.23456
  if (amp && (amp.equalTo(JSBI.BigInt(1)) || amp?.equalTo(JSBI.BigInt(0)))) return [undefined, undefined]
  const temp = amp?.divide(amp?.subtract(JSBI.BigInt(1)))
  if (!amp || !temp || !price) return [undefined, undefined]
  if (price instanceof Price) {
    return [price.asFraction.multiply(temp.multiply(temp)), price.asFraction.divide(temp.multiply(temp))]
  }
  return [price.asFraction.multiply(temp.multiply(temp)), price?.divide(temp.multiply(temp))]
}

export function parseSubgraphPoolData(
  poolData: SubgraphPoolData,
  chainId: ChainId,
): {
  reserve0: CurrencyAmount<Currency> | undefined
  virtualReserve0: CurrencyAmount<Currency> | undefined
  reserve1: CurrencyAmount<Currency> | undefined
  virtualReserve1: CurrencyAmount<Currency> | undefined
  totalSupply: CurrencyAmount<Currency> | undefined
  currency0: Currency
  currency1: Currency
} {
  const token0 = new Token(
    chainId,
    getAddress(poolData.token0.id),
    +poolData.token0.decimals,
    poolData.token0.symbol,
    poolData.token0.name,
  )
  const token1 = new Token(
    chainId,
    getAddress(poolData.token1.id),
    +poolData.token1.decimals,
    poolData.token1.symbol,
    poolData.token1.name,
  )
  const currency0 = unwrappedToken(token0)
  const currency1 = unwrappedToken(token1)

  const reserve0 = tryParseAmount(poolData.reserve0, currency0)
  const virtualReserve0 = tryParseAmount(poolData.vReserve0, currency0)
  const reserve1 = tryParseAmount(poolData.reserve1, currency1)
  const virtualReserve1 = tryParseAmount(poolData.vReserve1, currency1)
  const totalSupply = tryParseAmount(poolData.totalSupply, NativeCurrencies[chainId]) // Only care about decimals 18

  return {
    reserve0,
    virtualReserve0,
    reserve1,
    virtualReserve1,
    totalSupply,
    currency0,
    currency1,
  }
}

// const temp = pool.virtualReserve1.subtract(pool.reserve1).divide(pool.reserve1.decimalScale).asFraction

function getToken0MinPrice(pool: Pair | SubgraphPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve1.subtract(pool.reserve1).divide(pool.reserve1.decimalScale).asFraction
    return temp
      .multiply(temp)
      .divide(
        pool.virtualReserve0
          .divide(pool.virtualReserve0.decimalScale)
          .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction),
      )
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve1.subtract(reserve1).divide(reserve1.decimalScale).asFraction
      return temp
        .multiply(temp)
        .divide(
          virtualReserve0
            .divide(virtualReserve0.decimalScale)
            .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction),
        )
    } else {
      return new Fraction('-1')
    }
  }
}

function getToken0MaxPrice(pool: Pair | SubgraphPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve0.subtract(pool.reserve0).divide(pool.virtualReserve0.decimalScale).asFraction

    // Avoid error division by 0
    if (temp.equalTo(new Fraction('0'))) {
      return new Fraction('-1')
    }

    return pool.virtualReserve0
      .divide(pool.virtualReserve0.decimalScale)
      .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction)
      .divide(temp.multiply(temp))
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve0.subtract(reserve0).divide(virtualReserve0.decimalScale).asFraction

      // Avoid error division by 0
      if (temp.equalTo(new Fraction('0'))) {
        return new Fraction('-1')
      }

      return virtualReserve0
        .divide(virtualReserve0.decimalScale)
        .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction)
        .divide(temp.multiply(temp))
    } else {
      return new Fraction('-1')
    }
  }
}

function getToken1MinPrice(pool: Pair | SubgraphPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve0.subtract(pool.reserve0).divide(pool.reserve0.decimalScale).asFraction

    return temp
      .multiply(temp)
      .divide(
        pool.virtualReserve0
          .divide(pool.virtualReserve0.decimalScale)
          .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction),
      )
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve0.subtract(reserve0).divide(reserve0.decimalScale).asFraction
      return temp
        .multiply(temp)
        .divide(
          virtualReserve0
            .divide(virtualReserve0.decimalScale)
            .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction),
        )
    } else {
      return new Fraction('-1')
    }
  }
}

function getToken1MaxPrice(pool: Pair | SubgraphPoolData): Fraction {
  if (pool instanceof Pair) {
    const temp = pool.virtualReserve1.subtract(pool.reserve1).divide(pool.reserve1.decimalScale).asFraction

    // Avoid error division by 0
    if (temp.equalTo(new Fraction('0'))) {
      return new Fraction('-1')
    }

    return pool.virtualReserve0
      .divide(pool.virtualReserve0.decimalScale)
      .asFraction.multiply(pool.virtualReserve1.divide(pool.virtualReserve1.decimalScale).asFraction)
      .divide(temp)
      .divide(temp)
  } else {
    const { reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(pool, 1) // chainId doesn't matter.
    if (reserve0 && virtualReserve0 && reserve1 && virtualReserve1) {
      const temp = virtualReserve1.subtract(reserve1).divide(reserve1.decimalScale).asFraction

      // Avoid error division by 0
      if (temp.equalTo(new Fraction('0'))) {
        return new Fraction('-1')
      }

      return virtualReserve0
        .divide(virtualReserve0.decimalScale)
        .asFraction.multiply(virtualReserve1.divide(virtualReserve1.decimalScale).asFraction)
        .divide(temp)
        .divide(temp)
    } else {
      return new Fraction('-1')
    }
  }
}

export const priceRangeCalcByPair = (pair?: Pair): [Fraction | undefined, Fraction | undefined][] => {
  //Ex amp = 1.23456
  if (!pair || new Fraction(JSBI.BigInt(pair.amp)).equalTo(JSBI.BigInt(10000)))
    return [
      [undefined, undefined],
      [undefined, undefined],
    ]
  return [
    [getToken0MinPrice(pair), getToken0MaxPrice(pair)],
    [getToken1MinPrice(pair), getToken1MaxPrice(pair)],
  ]
}

export const priceRangeCalcBySubgraphPool = (
  pool?: SubgraphPoolData,
): [Fraction | undefined, Fraction | undefined][] => {
  if (!pool || new Fraction(pool.amp).equalTo(JSBI.BigInt(10000)))
    return [
      [undefined, undefined],
      [undefined, undefined],
    ]
  return [
    [getToken0MinPrice(pool), getToken0MaxPrice(pool)],
    [getToken1MinPrice(pool), getToken1MaxPrice(pool)],
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

export const getTradingFeeAPR = (liquidity?: string, feeOneDay?: string): number => {
  return !feeOneDay || !liquidity || parseFloat(liquidity) === 0
    ? 0
    : (parseFloat(feeOneDay) * 365 * 100) / parseFloat(liquidity)
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

function useFarmRewardsPerTimeUnit(farm?: Farm): RewardPerTimeUnit[] {
  if (!farm) {
    return []
  }

  const farmRewardsPerTimeUnit: RewardPerTimeUnit[] = []

  if (farm.rewardPerSeconds) {
    farm.rewardTokens.forEach((token, index) => {
      if (farmRewardsPerTimeUnit[index]) {
        farmRewardsPerTimeUnit[index].amount = farmRewardsPerTimeUnit[index].amount.add(
          BigNumber.from(farm.rewardPerSeconds[index]),
        )
      } else {
        farmRewardsPerTimeUnit[index] = {
          token,
          amount: BigNumber.from(farm.rewardPerSeconds[index]),
        }
      }
    })
  } else if (farm.rewardPerBlocks) {
    farm.rewardTokens.forEach((token, index) => {
      if (farmRewardsPerTimeUnit[index]) {
        farmRewardsPerTimeUnit[index].amount = farmRewardsPerTimeUnit[index].amount.add(
          BigNumber.from(farm.rewardPerBlocks[index]),
        )
      } else {
        farmRewardsPerTimeUnit[index] = {
          token,
          amount: BigNumber.from(farm.rewardPerBlocks[index]),
        }
      }
    })
  }

  return farmRewardsPerTimeUnit
}
/**
 * Get farm APR value in %
 * @param kncPriceUsd KNC price in USD
 * @param poolLiquidityUsd Total pool liquidity in USD
 * @returns
 */
export function useFarmApr(farm: Farm, poolLiquidityUsd: string): number {
  const { chainId, isEVM } = useActiveWeb3React()
  const currentBlock = useBlockNumber()
  const rewardsPerTimeUnit = useFarmRewardsPerTimeUnit(farm)
  const tokenPrices = useTokenPrices((rewardsPerTimeUnit || []).map(item => item.token.wrapped.address))

  let yearlyRewardUSD

  if (farm.rewardPerSeconds) {
    // FarmV2

    const currentTimestamp = Math.floor(Date.now() / 1000)

    // Check if pool is active for liquidity mining
    const isLiquidityMiningActive =
      currentTimestamp && farm.startTime && farm.endTime
        ? farm.startTime <= currentTimestamp && currentTimestamp <= farm.endTime
        : false

    if (parseFloat(poolLiquidityUsd) === 0 || !isLiquidityMiningActive) {
      return 0
    }

    if (!rewardsPerTimeUnit || rewardsPerTimeUnit.length === 0) {
      return 0
    }

    yearlyRewardUSD = rewardsPerTimeUnit.reduce((total, rewardPerSecond, index) => {
      if (!rewardPerSecond || !rewardPerSecond.amount) {
        return total
      }

      if (chainId && tokenPrices[rewardPerSecond.token.wrapped.address]) {
        const rewardPerSecondAmount = TokenAmount.fromRawAmount(
          rewardPerSecond.token,
          rewardPerSecond.amount.toString(),
        )
        const yearlyETHRewardAllocation = parseFloat(rewardPerSecondAmount.toSignificant(6)) * SECONDS_PER_YEAR
        total += yearlyETHRewardAllocation * tokenPrices[rewardPerSecond.token.wrapped.address]
      }

      return total
    }, 0)
  } else {
    // Check if pool is active for liquidity mining
    const isLiquidityMiningActive =
      currentBlock && farm.startBlock && farm.endBlock
        ? farm.startBlock <= currentBlock && currentBlock <= farm.endBlock
        : false

    if (parseFloat(poolLiquidityUsd) === 0 || !isLiquidityMiningActive) {
      return 0
    }

    if (!rewardsPerTimeUnit || rewardsPerTimeUnit.length === 0) {
      return 0
    }

    yearlyRewardUSD = rewardsPerTimeUnit.reduce((total, rewardPerBlock, index) => {
      if (!rewardPerBlock || !rewardPerBlock.amount) {
        return total
      }

      if (isEVM && tokenPrices[index]) {
        const rewardPerBlockAmount = TokenAmount.fromRawAmount(rewardPerBlock.token, rewardPerBlock.amount.toString())
        const yearlyETHRewardAllocation =
          parseFloat(rewardPerBlockAmount.toSignificant(6)) * BLOCKS_PER_YEAR(chainId as EVM_NETWORK)
        total += yearlyETHRewardAllocation * tokenPrices[index]
      }

      return total
    }, 0)
  }

  const apr = (yearlyRewardUSD / parseFloat(poolLiquidityUsd)) * 100

  return apr
}

export function useCurrencyConvertedToNative(currency?: Currency): Currency | undefined {
  const { chainId } = useActiveWeb3React()
  return useMemo(() => {
    if (!!currency && !!chainId) {
      return currency.isNative ? NativeCurrencies[chainId] : currency
    }
    return undefined
  }, [chainId, currency])
}

export function useFarmRewards(farms?: Farm[], onlyCurrentUser = true): Reward[] {
  if (!farms) {
    return []
  }

  const initialRewards: { [key: string]: Reward } = {}

  const userFarmRewards = farms.reduce((total, farm) => {
    if (farm.userData?.rewards) {
      farm.rewardTokens.forEach((token, index) => {
        if (total[token.address]) {
          total[token.address].amount = total[token.address].amount.add(BigNumber.from(farm.userData?.rewards?.[index]))
        } else {
          total[token.address] = {
            token,
            amount: BigNumber.from(farm.userData?.rewards?.[index]),
          }
        }
      })
      return total
    } else {
      farm.rewardTokens.forEach(token => {
        total[token.address] = {
          token,
          amount: BigNumber.from(0),
        }
      })
    }

    return total
  }, initialRewards)

  const initialAllFarmsRewards: { [key: string]: Reward } = {}

  const allFarmsRewards = farms.reduce((total, farm) => {
    if (farm.rewardPerSeconds) {
      farm.rewardTokens.forEach((token, index) => {
        if (total[token.address]) {
          total[token.address].amount = total[token.address].amount.add(
            BigNumber.from(farm.lastRewardTime - farm.startTime).mul(farm.rewardPerSeconds[index]),
          )
        } else {
          total[token.address] = {
            token,
            amount: BigNumber.from(farm.lastRewardTime - farm.startTime).mul(farm.rewardPerSeconds[index]),
          }
        }
      })
    } else {
      farm.rewardTokens.forEach((token, index) => {
        if (total[token.address]) {
          total[token.address].amount = total[token.address].amount.add(
            BigNumber.from(farm.lastRewardBlock - farm.startBlock).mul(farm.rewardPerBlocks[index]),
          )
        } else {
          total[token.address] = {
            token,
            amount: BigNumber.from(farm.lastRewardBlock - farm.startBlock).mul(farm.rewardPerBlocks[index]),
          }
        }
      })
    }

    return total
  }, initialAllFarmsRewards)

  return onlyCurrentUser ? Object.values(userFarmRewards) : Object.values(allFarmsRewards)
}

export function useFarmRewardsUSD(rewards?: Reward[]): number {
  const { chainId } = useActiveWeb3React()
  const tokenPrices = useRewardTokenPrices((rewards || []).map(item => item.token))
  if (!rewards) {
    return 0
  }

  const rewardUSD = rewards.reduce((total, reward, index) => {
    if (!reward || !reward.amount || !reward.token) {
      return total
    }

    if (chainId && tokenPrices[index]) {
      total += parseFloat(getFullDisplayBalance(reward.amount, reward.token.decimals)) * tokenPrices[index]
    }

    return total
  }, 0)

  return rewardUSD
}

export function useRewardTokensFullInfo(): Token[] {
  const { chainId } = useActiveWeb3React()
  const rewardTokens = useRewardTokens()

  const allTokens = useAllTokens()
  const nativeName = NativeCurrencies[chainId].symbol

  return useMemo(
    () =>
      !!rewardTokens && allTokens
        ? rewardTokens.map(address =>
            address.toLowerCase() === ZERO_ADDRESS.toLowerCase()
              ? new Token(chainId, ZERO_ADDRESS.toLowerCase(), 18, nativeName, nativeName)
              : allTokens[address],
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainId, nativeName, JSON.stringify(rewardTokens)],
  )
}

export function useCheckIsFarmingPool(address: string): boolean {
  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()
  const uniqueAndActiveFarmAddresses = uniqueAndActiveFarms.map(farm => farm.id)

  return uniqueAndActiveFarmAddresses.includes(address) || uniqueAndActiveFarmAddresses.includes(address.toLowerCase())
}

export function errorFriendly(text: string): string {
  const error = text?.toLowerCase?.() || ''
  if (!error || error.includes('router: expired')) {
    return 'An error occurred. Refresh the page and try again '
  }
  if (
    error.includes('mintotalamountout') ||
    error.includes('err_limit_out') ||
    error.includes('return amount is not enough') ||
    error.includes('code=call_exception') ||
    error.includes('none of the calls threw an error')
  ) {
    return t`An error occurred. Try refreshing the price rate or increase max slippage`
  }
  if (error.includes('header not found') || error.includes('swap failed')) {
    return t`An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.`
  }
  if (error.includes('user rejected transaction')) {
    return t`User rejected transaction.`
  }

  // classic/elastic remove liquidity error
  if (error.includes('insufficient')) {
    return t`An error occurred. Please try increasing max slippage`
  }

  return t`An error occurred`
}

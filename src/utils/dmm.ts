import { useMemo } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { Fraction, JSBI, Price, Pair, Token, Currency, WETH } from 'libs/sdk/src'
import { ZERO, ONE, ChainId } from 'libs/sdk/src/constants'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum } from 'utils'
import { TokenAmount as TokenAmountSUSHI, Token as TokenSUSHI, ChainId as ChainIdSUSHI } from '@sushiswap/sdk'
import { TokenAmount as TokenAmountUNI, Token as TokenUNI, ChainId as ChainIdUNI } from '@uniswap/sdk'
import { Token as TokenDMM, TokenAmount as TokenAmountDMM, ChainId as ChainIdDMM } from 'libs/sdk/src'
import { BLOCKS_PER_YEAR, FARMING_POOLS, KNC, ZERO_ADDRESS } from '../constants'
import { useActiveWeb3React } from 'hooks'
import { Farm, Reward, RewardPerBlock } from 'state/farms/types'
import { useAllTokens } from 'hooks/Tokens'
import { useRewardTokens } from 'state/farms/hooks'
import { useETHPrice, useKNCPrice, useTokensPrice } from 'state/application/hooks'
import { getFullDisplayBalance } from './formatBalance'

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

  // Avoid error division by 0
  if (temp.equalTo(new Fraction('0'))) {
    return new Fraction('-1')
  }

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

  // Avoid error division by 0
  if (temp.equalTo(new Fraction('0'))) {
    return new Fraction('-1')
  }

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

export function convertChainIdFromDmmToSushi(chainId: ChainIdDMM) {
  switch (chainId) {
    case ChainIdDMM.MAINNET:
      return ChainIdSUSHI.MAINNET
    case ChainIdDMM.ROPSTEN:
      return ChainIdSUSHI.ROPSTEN
    case ChainIdDMM.RINKEBY:
      return ChainIdSUSHI.RINKEBY
    case ChainIdDMM.GÖRLI:
      return ChainIdSUSHI.GÖRLI
    case ChainIdDMM.KOVAN:
      return ChainIdSUSHI.KOVAN
    case ChainIdDMM.MATIC:
      return ChainIdSUSHI.MATIC
    case ChainIdDMM.MUMBAI:
      return ChainIdSUSHI.MATIC_TESTNET
    case ChainIdDMM.BSCTESTNET:
      return ChainIdSUSHI.BSC_TESTNET
    case ChainIdDMM.BSCMAINNET:
      return ChainIdSUSHI.BSC
    case ChainIdDMM.AVAXTESTNET:
      return ChainIdSUSHI.FUJI
    case ChainIdDMM.AVAXMAINNET:
      return ChainIdSUSHI.AVALANCHE
  }
}

export function convertChainIdFromUniToDMM(chainId: ChainIdUNI) {
  switch (chainId) {
    case ChainIdUNI.MAINNET:
      return ChainIdDMM.MAINNET
    case ChainIdUNI.ROPSTEN:
      return ChainIdDMM.ROPSTEN
    case ChainIdUNI.RINKEBY:
      return ChainIdDMM.RINKEBY
    case ChainIdUNI.GÖRLI:
      return ChainIdDMM.GÖRLI
    case ChainIdUNI.KOVAN:
      return ChainIdDMM.KOVAN
  }
}

export function convertChainIdFromDmmToUni(chainId: ChainIdDMM) {
  switch (chainId) {
    case ChainIdDMM.MAINNET:
      return ChainIdUNI.MAINNET
    case ChainIdDMM.ROPSTEN:
      return ChainIdUNI.ROPSTEN
    case ChainIdDMM.RINKEBY:
      return ChainIdUNI.RINKEBY
    case ChainIdDMM.GÖRLI:
      return ChainIdUNI.GÖRLI
    case ChainIdDMM.KOVAN:
      return ChainIdUNI.KOVAN
    default:
      return undefined
  }
}

export function convertChainIdFromSushiToDMM(chainId: ChainIdSUSHI) {
  switch (chainId) {
    case ChainIdSUSHI.MAINNET:
      return ChainIdDMM.MAINNET
    case ChainIdSUSHI.ROPSTEN:
      return ChainIdDMM.ROPSTEN
    case ChainIdSUSHI.RINKEBY:
      return ChainIdDMM.RINKEBY
    case ChainIdSUSHI.GÖRLI:
      return ChainIdDMM.GÖRLI
    case ChainIdSUSHI.KOVAN:
      return ChainIdDMM.KOVAN
    case ChainIdSUSHI.MATIC:
      return ChainIdDMM.MATIC
    case ChainIdSUSHI.MATIC_TESTNET:
      return ChainIdDMM.MUMBAI
    default:
      return undefined
  }
}

export function tokenSushiToDmm(tokenSushi: TokenSUSHI): TokenDMM | undefined {
  const chainIdDMM = convertChainIdFromSushiToDMM(tokenSushi.chainId)
  return !!chainIdDMM
    ? new TokenDMM(chainIdDMM, tokenSushi.address, tokenSushi.decimals, tokenSushi.symbol, tokenSushi.name)
    : undefined
}
export function tokenDmmToSushi(tokenDmm: TokenDMM): TokenSUSHI {
  return new TokenSUSHI(
    convertChainIdFromDmmToSushi(tokenDmm.chainId),
    tokenDmm.address,
    tokenDmm.decimals,
    tokenDmm.symbol,
    tokenDmm.name
  )
}

export function tokenUniToDmm(tokenUni: TokenUNI): TokenDMM | undefined {
  return new TokenDMM(tokenUni.chainId as ChainId, tokenUni.address, tokenUni.decimals, tokenUni.symbol, tokenUni.name)
}

export function tokenDmmToUni(tokenDmm: TokenDMM): TokenUNI | undefined {
  const chainIdUNI = convertChainIdFromDmmToUni(tokenDmm.chainId)
  return !!chainIdUNI
    ? new TokenUNI(chainIdUNI, tokenDmm.address, tokenDmm.decimals, tokenDmm.symbol, tokenDmm.name)
    : undefined
}

export function tokenAmountDmmToSushi(amount: TokenAmountDMM): TokenAmountSUSHI {
  return new TokenAmountSUSHI(
    new TokenSUSHI(
      convertChainIdFromDmmToSushi(amount.token.chainId),
      amount.token.address,
      amount.token.decimals,
      amount.token.symbol,
      amount.token.name
    ),
    amount.raw
  )
}

export function tokenAmountDmmToUni(amount: TokenAmountDMM): TokenAmountUNI | undefined {
  const chainIdUNI = convertChainIdFromDmmToUni(amount.token.chainId)
  return !!chainIdUNI
    ? new TokenAmountUNI(
        new TokenUNI(chainIdUNI, amount.token.address, amount.token.decimals, amount.token.symbol, amount.token.name),
        amount.raw
      )
    : undefined
}

/**
 * Get farm APR value in %
 * @param kncPriceUsd KNC price in USD
 * @param poolLiquidityUsd Total pool liquidity in USD
 * @returns
 */

export function useFarmApr(
  rewardPerBlocks: RewardPerBlock[],
  poolLiquidityUsd: string,
  isLiquidityMiningActive?: boolean
): number {
  const { chainId } = useActiveWeb3React()
  const tokenPrices = useTokensPrice((rewardPerBlocks || []).map(item => item.token))

  if (parseFloat(poolLiquidityUsd) === 0 || !isLiquidityMiningActive) {
    return 0
  }

  if (!rewardPerBlocks || rewardPerBlocks.length === 0) {
    return 0
  }

  const yearlyRewardUSD = rewardPerBlocks.reduce((total, rewardPerBlock, index) => {
    if (!rewardPerBlock || !rewardPerBlock.amount) {
      return total
    }

    if (chainId && tokenPrices[index]) {
      const rewardPerBlockAmount = new TokenAmountDMM(rewardPerBlock.token, rewardPerBlock.amount.toString())
      const yearlyETHRewardAllocation =
        parseFloat(rewardPerBlockAmount.toSignificant(6)) * BLOCKS_PER_YEAR[chainId as ChainId]
      total += yearlyETHRewardAllocation * tokenPrices[index]
    }

    return total
  }, 0)

  const apr = (yearlyRewardUSD / parseFloat(poolLiquidityUsd)) * 100

  return apr
}

export function convertToNativeTokenFromETH(currency: Currency, chainId?: ChainIdDMM): Currency {
  if (chainId && currency === Currency.ETHER) {
    if ([137, 80001].includes(chainId)) return new TokenDMM(chainId, WETH[chainId].address, 18, 'MATIC', 'MATIC')
    if ([97, 56].includes(chainId)) return new TokenDMM(chainId, WETH[chainId].address, 18, 'BNB', 'BNB')
    if ([43113, 43114].includes(chainId)) return new TokenDMM(chainId, WETH[chainId].address, 18, 'AVAX', 'AVAX')
  }

  return currency
}

export function useCurrencyConvertedToNative(currency?: Currency): Currency | undefined {
  const { chainId } = useActiveWeb3React()
  if (!!currency && !!chainId) {
    return convertToNativeTokenFromETH(currency, chainId)
  }
  return undefined
}

export function useFarmRewards(farms?: Farm[]): Reward[] {
  if (!farms) {
    return []
  }

  const initialRewards: { [key: string]: Reward } = {}

  const farmRewards = farms.reduce((total, farm) => {
    if (farm.userData?.rewards) {
      farm.rewardTokens.forEach((token, index) => {
        if (total[token.address]) {
          total[token.address].amount = total[token.address].amount.add(BigNumber.from(farm.userData?.rewards?.[index]))
        } else {
          total[token.address] = {
            token,
            amount: BigNumber.from(farm.userData?.rewards?.[index])
          }
        }
      })
      return total
    }

    return total
  }, initialRewards)

  return Object.values(farmRewards)
}

export function useFarmRewardsUSD(rewards?: Reward[]): number {
  const { chainId } = useActiveWeb3React()
  const tokenPrices = useTokensPrice((rewards || []).map(item => item.token))
  if (!rewards) {
    return 0
  }

  const rewardUSD = rewards.reduce((total, reward, index) => {
    if (!reward || !reward.amount || !reward.token) {
      return total
    }

    if (chainId && tokenPrices[index]) {
      total += parseFloat(getFullDisplayBalance(reward.amount)) * tokenPrices[index]
    }

    return total
  }, 0)

  return rewardUSD
}

export function useFarmRewardPerBlocks(farms?: Farm[]): RewardPerBlock[] {
  if (!farms) {
    return []
  }

  const initialRewardPerBlocks: RewardPerBlock[] = []

  const farmRewardPerBlocks = farms.reduce((total, farm) => {
    if (farm.rewardPerBlocks) {
      farm.rewardTokens.forEach((token, index) => {
        if (total[index]) {
          total[index].amount = total[index].amount.add(BigNumber.from(farm.rewardPerBlocks[index]))
        } else {
          total[index] = {
            token,
            amount: BigNumber.from(farm.rewardPerBlocks[index])
          }
        }
      })
      return total
    }

    return total
  }, initialRewardPerBlocks)

  return farmRewardPerBlocks
}

export function useRewardTokensFullInfo(): Token[] {
  const { chainId } = useActiveWeb3React()
  const rewardTokens = useRewardTokens()
  const allTokens = useAllTokens()
  const nativeName =
    chainId && [137, 80001].includes(chainId)
      ? 'MATIC'
      : chainId && [97, 56].includes(chainId)
      ? 'BNB'
      : chainId && [43113, 43114].includes(chainId)
      ? 'AVAX'
      : 'ETH'

  return useMemo(
    () =>
      !!rewardTokens
        ? rewardTokens.map(address =>
            address.toLowerCase() === ZERO_ADDRESS.toLowerCase()
              ? new Token(chainId as ChainId, ZERO_ADDRESS.toLowerCase(), 18, nativeName, nativeName)
              : allTokens[address]
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainId, nativeName, JSON.stringify(rewardTokens)]
  )
}

export function checkIsFarmingPool(address: string, chainId?: ChainId): boolean {
  if (!chainId) {
    chainId = ChainId.MAINNET
  }

  const farmingPools = FARMING_POOLS[chainId]

  return farmingPools.includes(address) || farmingPools.includes(address.toLowerCase())
}

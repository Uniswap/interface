import { ChainId, useContractKit } from '@celo-tools/use-contractkit'
import { BigNumber } from '@ethersproject/bignumber'
import { ChainId as UbeswapChainId, JSBI, Pair, Token, TokenAmount } from '@ubeswap/sdk'
import { POOL_MANAGER } from 'constants/poolManager'
import { UBE } from 'constants/tokens'
import { PoolManager } from 'generated/'
import { useAllTokens } from 'hooks/Tokens'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { zip } from 'lodash'
// Hooks
import { useMemo } from 'react'

import ERC_20_INTERFACE from '../../constants/abis/erc20'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
// Interfaces
import { UNISWAP_V2_PAIR_INTERFACE } from '../../constants/abis/uniswap-v2-pair'
import { usePoolManagerContract, useTokenContract } from '../../hooks/useContract'
import {
  NEVER_RELOAD,
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
} from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'
import { useMultiStakeRewards } from './useDualStakeRewards'
import useStakingInfo from './useStakingInfo'

export type MultiRewardPool = {
  address: string
  underlyingPool: string
  basePool: string
  numRewards: number
  active: boolean
}

export const multiRewardPools: MultiRewardPool[] = [
  // CELO-MOBI
  {
    address: '0xd930501A0848DC0AA3E301c7B9b8AFE8134D7f5F',
    underlyingPool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    basePool: '0x19F1A692C77B481C23e9916E3E83Af919eD49765',
    numRewards: 2,
    active: true,
  },
  // CELO-mcUSD
  {
    address: '0xbbC8C824c638fd238178a71F5b1E5Ce7e4Ce586B',
    underlyingPool: '0x66bD2eF224318cA5e3A93E165e77fAb6DD986E89',
    basePool: '0x66bD2eF224318cA5e3A93E165e77fAb6DD986E89',
    numRewards: 2,
    active: true,
  },
  // CELO-mcEUR
  {
    address: '0x0F3d01aea89dA0b6AD81712Edb96FA7AF1c17E9B',
    underlyingPool: '0x08252f2E68826950d31D268DfAE5E691EE8a2426',
    basePool: '0x08252f2E68826950d31D268DfAE5E691EE8a2426',
    numRewards: 2,
    active: true,
  },
  // UBE-CELO
  {
    address: '0x9D87c01672A7D02b2Dc0D0eB7A145C7e13793c3B',
    underlyingPool: '0x295D6f96081fEB1569d9Ce005F7f2710042ec6a1',
    basePool: '0x295D6f96081fEB1569d9Ce005F7f2710042ec6a1',
    numRewards: 2,
    active: true,
  },
  // rCELO-CELO
  {
    address: '0x194478Aa91e4D7762c3E51EeE57376ea9ac72761',
    underlyingPool: '0xD7D6b5213b9B9DFffbb7ef008b3cF3c677eb2468',
    basePool: '0xD7D6b5213b9B9DFffbb7ef008b3cF3c677eb2468',
    numRewards: 2,
    active: true,
  },
  // mCUSD-mcEUR
  {
    address: '0x2f0ddEAa9DD2A0FB78d41e58AD35373d6A81EbB0',
    underlyingPool: '0xaf13437122cd537C5D8942f17787cbDBd787fE94',
    basePool: '0xaf13437122cd537C5D8942f17787cbDBd787fE94',
    numRewards: 2,
    active: false,
  },
  // MOO-mCELO
  {
    address: '0x84Bb1795b699Bf7a798C0d63e9Aad4c96B0830f4',
    underlyingPool: '0xC087aEcAC0a4991f9b0e931Ce2aC77a826DDdaf3',
    basePool: '0xC087aEcAC0a4991f9b0e931Ce2aC77a826DDdaf3',
    numRewards: 2,
    active: false,
  },
  // mCUSD-mcEUR
  {
    address: '0x3d823f7979bB3af846D8F1a7d98922514eA203fC',
    underlyingPool: '0xb030882bfc44e223fd5e20d8645c961be9b30bb3',
    basePool: '0xaf13437122cd537C5D8942f17787cbDBd787fE94',
    numRewards: 3,
    active: true,
  },
  // MOO-mCELO
  {
    address: '0x3c7beeA32A49D96d72ce45C7DeFb5b287479C2ba',
    underlyingPool: '0x8f309df7527f16dff49065d3338ea3f3c12b5d09',
    basePool: '0xC087aEcAC0a4991f9b0e931Ce2aC77a826DDdaf3',
    numRewards: 3,
    active: true,
  },
]

export const STAKING_GENESIS = 1619100000

export interface StakingInfo {
  // the address of the reward contract
  readonly stakingRewardAddress: string
  // the token of the liquidity pool
  readonly stakingToken: Token
  // the tokens involved in this pair
  readonly tokens: readonly [Token, Token]
  // the amount of token currently staked, or undefined if no account
  readonly stakedAmount?: TokenAmount
  // the total amount of token staked in the contract
  readonly totalStakedAmount: TokenAmount
  // the amount of reward tokens earned by the active account, or undefined if no account
  readonly earnedAmounts?: TokenAmount[]
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  readonly rewardRates?: TokenAmount[]
  // the amount of token distributed per second to all LPs, constant
  readonly totalRewardRates: TokenAmount[]
  // when the period ends
  readonly periodFinish: Date | undefined
  // if pool is active
  readonly active: boolean
  // calculates a hypothetical amount of token distributed to the active account per second.
  readonly getHypotheticalRewardRate: (
    stakedAmount: TokenAmount,
    totalStakedAmount: TokenAmount,
    totalRewardRates: TokenAmount[]
  ) => TokenAmount[]
  readonly nextPeriodRewards: TokenAmount
  readonly poolInfo: IRawPool
  readonly rewardTokens: Token[]
}

export const usePairDualStakingInfo = (
  stakingInfo: StakingInfo | undefined,
  stakingAddress: string
): StakingInfo | null => {
  const multiRewardPool = multiRewardPools
    .filter((x) => x.address.toLowerCase() === stakingAddress.toLowerCase())
    .find((x) => x.basePool === stakingInfo?.poolInfo.poolAddress)
  return useMultiStakeRewards(multiRewardPool?.address ?? '', stakingInfo, 2, multiRewardPool?.active || false)
}

export const usePairTripleStakingInfo = (
  stakingInfo: StakingInfo | undefined,
  stakingAddress: string
): StakingInfo | null => {
  const multiRewardPool = multiRewardPools
    .filter((x) => x.address.toLowerCase() === stakingAddress.toLowerCase())
    .find((x) => x.basePool === stakingInfo?.poolInfo.poolAddress)
  const dualPool = useMultiStakeRewards(multiRewardPool?.underlyingPool ?? '', stakingInfo, 2, true)
  const triplePool = useMultiStakeRewards(multiRewardPool?.address ?? '', dualPool, 3, multiRewardPool?.active || false)
  if (multiRewardPool?.numRewards === 2) {
    return null
  }
  return triplePool
}

interface UnclaimedInfo {
  /**
   * Total tokens left in the contract
   */
  balanceRemaining: BigNumber | null
  /**
   * Earned but unclaimed tokens
   */
  earned: BigNumber | null
  /**
   * Tokens not in the circulating supply
   */
  noncirculatingSupply: BigNumber | null
}

export const useUnclaimedStakingRewards = (): UnclaimedInfo => {
  const { network } = useContractKit()
  const { chainId } = network
  const ube = chainId ? UBE[chainId] : undefined
  const ubeContract = useTokenContract(ube?.address)
  const poolManagerContract = usePoolManagerContract(chainId !== ChainId.Baklava ? POOL_MANAGER[chainId] : undefined)
  const poolsCountBigNumber = useSingleCallResult(poolManagerContract, 'poolsCount').result?.[0] as
    | BigNumber
    | undefined
  const poolsCount = poolsCountBigNumber?.toNumber() ?? 0
  const poolAddresses = useStakingPoolAddresses(poolManagerContract, poolsCount)

  // compute amount that is locked up
  const balancesRaw = useSingleContractMultipleData(
    ubeContract,
    'balanceOf',
    poolAddresses.map((addr) => [addr])
  )
  const balances = balancesRaw.find((b) => !b.result)
    ? null
    : (balancesRaw.map((b) => b.result?.[0] ?? BigNumber.from(0)) as readonly BigNumber[])
  const balanceRemaining = balances?.reduce((sum, b) => b.add(sum), BigNumber.from(0)) ?? null

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(
    poolAddresses,
    STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )

  const periodFinishes = useMultipleContractSingleData(
    poolAddresses,
    STAKING_REWARDS_INTERFACE,
    'periodFinish',
    undefined,
    NEVER_RELOAD
  )

  const now = useCurrentBlockTimestamp()
  const amounts = now
    ? zip(rewardRates, periodFinishes).map(([rate, finish]): BigNumber => {
        const rawRate = rate?.result?.[0] as BigNumber | undefined
        const finishTime = finish?.result?.[0] as BigNumber | undefined
        if (rawRate && finishTime && finishTime.gt(now)) {
          return rawRate.mul(finishTime.sub(now).toNumber())
        }
        return BigNumber.from(0)
      })
    : undefined
  const earned =
    rewardRates?.[0]?.loading || !amounts ? null : amounts.reduce((sum, amt) => sum.add(amt), BigNumber.from(0))

  return {
    balanceRemaining,
    earned,
    noncirculatingSupply: balanceRemaining && earned ? balanceRemaining.sub(earned) : null,
  }
}

interface IStakingPool {
  stakingRewardAddress: string
  tokens?: readonly [Token, Token]
  poolInfo: IRawPool
}

export function useStakingPools(pairToFilterBy?: Pair | null, stakingAddress?: string): readonly IStakingPool[] {
  const { network } = useContractKit()
  const chainId = network.chainId as unknown as UbeswapChainId
  const ube = chainId ? UBE[chainId] : undefined

  const poolManagerContract = usePoolManagerContract(
    chainId !== UbeswapChainId.BAKLAVA ? POOL_MANAGER[chainId] : undefined
  )
  const poolsCountBigNumber = useSingleCallResult(poolManagerContract, 'poolsCount').result?.[0] as
    | BigNumber
    | undefined
  const poolsCount = poolsCountBigNumber?.toNumber() ?? 0

  const poolAddresses = useStakingPoolAddresses(poolManagerContract, poolsCount)
  const pools = useStakingPoolsInfo(poolManagerContract, poolAddresses)

  const stakingTokens = pools.map((p) => p?.stakingToken as string)
  const poolPairs = usePairDataFromAddresses(stakingTokens)

  return useMemo(() => {
    if (!ube || !pools || !poolPairs) return []

    return (
      pools
        .reduce((memo: IStakingPool[], poolInfo, index) => {
          return [
            ...memo,
            {
              stakingRewardAddress: poolInfo.poolAddress,
              tokens: poolPairs[index],
              poolInfo,
            },
          ]
        }, [])
        .filter((stakingRewardInfo) => {
          if (pairToFilterBy === undefined) {
            return true
          }
          if (pairToFilterBy === null) {
            return false
          }
          if (stakingAddress) {
            return stakingAddress.toLowerCase() === stakingRewardInfo.stakingRewardAddress.toLowerCase()
          }
          return (
            stakingRewardInfo.tokens &&
            pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
            pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
          )
        }) ?? []
    )
  }, [ube, pools, poolPairs, pairToFilterBy, stakingAddress])
}

export function useStakingPoolAddresses(
  poolManagerContract: PoolManager | null,
  poolsCount: number
): readonly string[] {
  // Get rewards pools addresses
  const inputs = [...Array(poolsCount).keys()].map((i) => [i])
  const poolAddresses = useSingleContractMultipleData(poolManagerContract, 'poolsByIndex', inputs)

  return useMemo(() => {
    return !poolAddresses.length || !poolAddresses[0] || poolAddresses[0].loading
      ? []
      : poolAddresses.map((p) => p?.result?.[0]).filter((x): x is string => !!x)
  }, [poolAddresses])
}

interface IRawPool {
  index: number
  stakingToken: string
  poolAddress: string
  weight: number
  rewardToken?: string
  rewardTokenSymbol?: string
  nextPeriod?: number
  nextPeriodRewards?: BigNumber | null
}

const EXTERNAL_POOLS: IRawPool[] = [
  {
    index: -1,
    poolAddress: '0x33F819986FE80A4f4A9032260A24770918511849',
    stakingToken: '0xF97E6168283e38FC42725082FC63b47B6cD16B18',
    rewardToken: '0x18414Ce6dAece0365f935F3e78A7C1993e77d8Cd',
    rewardTokenSymbol: 'LAPIS',
    weight: 0,
  },
  {
    index: -1,
    poolAddress: '0xD409B7C4F67F5C845c53505b3d3B5aCD44e479AB',
    stakingToken: '0x573bcEBD09Ff805eD32df2cb1A968418DC74DCf7',
    rewardToken: '0x18414Ce6dAece0365f935F3e78A7C1993e77d8Cd',
    rewardTokenSymbol: 'LAPIS',
    weight: 0,
  },
]

export function useStakingPoolsInfo(
  poolManagerContract: PoolManager | null,
  poolAddresses: readonly string[]
): readonly IRawPool[] {
  const pools = useSingleContractMultipleData(
    poolManagerContract,
    'pools',
    poolAddresses.map((addr) => [addr])
  )

  const rawPools = useMemo(() => {
    return !pools || !pools[0] || pools[0].loading
      ? []
      : pools.map((p) => p?.result as unknown as IRawPool | undefined).filter((x): x is IRawPool => !!x)
  }, [pools])

  const nextPeriod = useSingleCallResult(poolManagerContract, 'nextPeriod')
  const poolRewards = useSingleContractMultipleData(
    poolManagerContract,
    'computeAmountForPool',
    rawPools.map((p) => [p.stakingToken, nextPeriod?.result?.[0]])
  )
  return rawPools.concat(EXTERNAL_POOLS).map((pool, i) => ({
    ...pool,
    nextPeriodRewards: poolRewards?.[i]?.result?.[0] ?? null,
  }))
}

export function usePairDataFromAddresses(
  pairAddresses: readonly string[]
): readonly (readonly [Token, Token] | undefined)[] {
  const { network } = useContractKit()
  const chainId = network.chainId as unknown as UbeswapChainId

  const token0Data = useMultipleContractSingleData(
    pairAddresses,
    UNISWAP_V2_PAIR_INTERFACE,
    'token0',
    undefined,
    NEVER_RELOAD
  )

  const token1Data = useMultipleContractSingleData(
    pairAddresses,
    UNISWAP_V2_PAIR_INTERFACE,
    'token1',
    undefined,
    NEVER_RELOAD
  )

  const tokens0 = token0Data.map((t) => t?.result?.[0] as string | undefined)
  const tokens1 = token1Data.map((t) => t?.result?.[0] as string | undefined)
  const tokensDb = useAllTokens()

  // Construct a set of all the unique token addresses that are not in the tokenlists.
  const tokenAddressesNeededToFetch = useMemo(
    () =>
      [...new Set([...tokens0, ...tokens1])].filter((addr): addr is string => addr !== undefined && !tokensDb[addr]),
    [tokensDb, tokens0, tokens1]
  )

  const names = useMultipleContractSingleData(
    tokenAddressesNeededToFetch,
    ERC_20_INTERFACE,
    'name',
    undefined,
    NEVER_RELOAD
  )

  const symbols = useMultipleContractSingleData(
    tokenAddressesNeededToFetch,
    ERC_20_INTERFACE,
    'symbol',
    undefined,
    NEVER_RELOAD
  )

  const tokenDecimals = useMultipleContractSingleData(
    tokenAddressesNeededToFetch,
    ERC_20_INTERFACE,
    'decimals',
    undefined,
    NEVER_RELOAD
  )

  // Construct the full token data
  const tokensNeededToFetch: readonly Token[] | null = useMemo(() => {
    if (!tokenAddressesNeededToFetch.length || !names.length || !symbols.length || !tokenDecimals.length) return null
    if (names[0].loading || tokenDecimals[0].loading || symbols[0].loading) return null
    if (!names[0].result || !tokenDecimals[0].result || !symbols[0].result) return null

    return tokenAddressesNeededToFetch.reduce((memo: Token[], address, index) => {
      const decimals = tokenDecimals[index].result?.[0]
      const name = names[index].result?.[0] === 'Celo Gold' ? 'Celo' : names[index].result?.[0]
      const symbol = symbols[index].result?.[0] === 'cGLD' ? 'CELO' : symbols[index].result?.[0] // todo - remove hardcoded symbol swap for CELO

      const token = new Token(chainId, address, decimals, symbol, name)
      return [...memo, token]
    }, [])
  }, [chainId, tokenAddressesNeededToFetch, names, symbols, tokenDecimals])

  const pairsData: readonly (readonly [Token, Token] | undefined)[] = useMemo(() => {
    const tokens = tokensNeededToFetch ?? []
    return tokens0.reduce((pairs: readonly (readonly [Token, Token] | undefined)[], token0Address, index) => {
      if (!token0Address) {
        return [...pairs, undefined]
      }
      const token1Address = tokens1[index]
      if (!token1Address) {
        return [...pairs, undefined]
      }
      const token0 = tokensDb[token0Address] ?? tokens.find((t) => t.address === token0Address)
      const token1 = tokensDb[token1Address] ?? tokens.find((t) => t.address === token1Address)
      if (!token0 || !token1) {
        return [...pairs, undefined]
      }
      return [...pairs, [token0, token1]]
    }, [])
  }, [tokensNeededToFetch, tokens0, tokens1, tokensDb])

  return pairsData
}

export function useTotalUbeEarned(): TokenAmount | undefined {
  const { network } = useContractKit()
  const { chainId } = network
  const ube = chainId ? UBE[chainId] : undefined
  const stakingInfos = useStakingInfo()

  return useMemo(() => {
    if (!ube) return undefined
    return (
      stakingInfos
        ?.filter((stakingInfo) => stakingInfo.rewardTokens.includes(ube))
        .reduce(
          (accumulator, stakingInfo) =>
            accumulator.add(
              stakingInfo.earnedAmounts?.find((earnedAmount) => earnedAmount.token == ube) ?? new TokenAmount(ube, '0')
            ),
          new TokenAmount(ube, '0')
        ) ?? new TokenAmount(ube, '0')
    )
  }, [stakingInfos, ube])
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: TokenAmount
  error?: string
} {
  const { address } = useContractKit()

  const parsedInput: TokenAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!address) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error,
  }
}

// based on typed value
export function useDerivedUnstakeInfo(
  typedValue: string,
  stakingAmount: TokenAmount
): {
  parsedAmount?: TokenAmount
  error?: string
} {
  const { address } = useContractKit()

  const parsedInput: TokenAmount | undefined = tryParseAmount(typedValue, stakingAmount.token)

  const parsedAmount = parsedInput && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!address) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error,
  }
}

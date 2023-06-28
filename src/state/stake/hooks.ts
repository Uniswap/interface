import { ChainId, useCelo, useProvider } from '@celo/react-celo'
import { BigNumber } from '@ethersproject/bignumber'
import { ChainId as UbeswapChainId, JSBI, Pair, Token, TokenAmount } from '@ubeswap/sdk'
import { POOL_MANAGER } from 'constants/poolManager'
import { UBE } from 'constants/tokens'
import { MoolaStakingRewards__factory, PoolManager } from 'generated/'
import { useAllTokens } from 'hooks/Tokens'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import zip from 'lodash/zip'
// Hooks
import React, { useEffect, useMemo } from 'react'

import ERC_20_INTERFACE from '../../constants/abis/erc20'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
// Interfaces
import { UNISWAP_V2_PAIR_INTERFACE } from '../../constants/abis/uniswap-v2-pair'
import { usePoolManagerContract, useTokenContract } from '../../hooks/useContract'
import { useFarmRegistry } from '../../pages/Earn/useFarmRegistry'
import {
  NEVER_RELOAD,
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
} from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'
import { useMultiStakeRewards } from './useDualStakeRewards'
import useStakingInfo from './useStakingInfo'

export const STAKING_GENESIS = 1619100000
const ACTIVE_CONTRACT_UPDATED_THRESHOLD = 5259492
const UNPREDICTABLE_GAS_LIMIT_ERROR_CODE = 'UNPREDICTABLE_GAS_LIMIT'

export interface StakingInfo {
  // the address of the reward contract
  readonly stakingRewardAddress: string | undefined
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

type MultiRewardPool = {
  address: string
  underlyingPool: string
  basePool: string
  numRewards: number
  active: boolean
}

export const useMultiRewardPools = (): MultiRewardPool[] => {
  const library = useProvider()
  const farmSummaries = useFarmRegistry()

  const [multiRewardPools, setMultiRewardPools] = React.useState<MultiRewardPool[]>([])

  const call = React.useCallback(async () => {
    const multiRwdPools: MultiRewardPool[] = []

    await Promise.all(
      farmSummaries.map(async (fs) => {
        let poolContract = MoolaStakingRewards__factory.connect(fs.stakingAddress, library)
        const rewardsTokens = []
        const externalStakingRwdAddresses = []

        // the first reward token at the top level
        rewardsTokens.push(await poolContract.rewardsToken())

        // last time the contract was updated - set isActive to false if it has been longer than 2 months
        let periodFinish = await poolContract.periodFinish()
        let isActive = Math.floor(Date.now() / 1000) - periodFinish.toNumber() < ACTIVE_CONTRACT_UPDATED_THRESHOLD

        let baseContractFound = false
        // recursivley find underlying and base pool contracts
        while (!baseContractFound) {
          try {
            // find the underlying contract if one exists
            const externalStakingRewardAddr = await poolContract.externalStakingRewards()
            externalStakingRwdAddresses.push(externalStakingRewardAddr)

            // capture the contract's reward token
            poolContract = MoolaStakingRewards__factory.connect(externalStakingRewardAddr, library)
            rewardsTokens.push(await poolContract.rewardsToken())

            // determine if the underlying contract is active or not
            periodFinish = await poolContract.periodFinish()
            isActive =
              Math.floor(Date.now() / 1000) - periodFinish.toNumber() < ACTIVE_CONTRACT_UPDATED_THRESHOLD || isActive
          } catch (e: any) {
            //if the error is not what is expected - log it
            if (e.code !== UNPREDICTABLE_GAS_LIMIT_ERROR_CODE) {
              console.log(e)
            }

            //set true when externalStakingRewards() throws an error
            baseContractFound = true
          }
        }

        if (externalStakingRwdAddresses.length) {
          multiRwdPools.push({
            address: fs.stakingAddress,
            underlyingPool: externalStakingRwdAddresses[0],
            basePool: externalStakingRwdAddresses[externalStakingRwdAddresses.length - 1],
            numRewards: rewardsTokens.length,
            active: isActive,
          })
        }
      })
    )
    setMultiRewardPools(multiRwdPools)
  }, [farmSummaries, library])

  useEffect(() => {
    call()
  }, [call])

  return multiRewardPools
}

export const usePairMultiStakingInfo = (
  stakingInfo: StakingInfo | undefined,
  stakingAddress: string
): StakingInfo | null => {
  const multiRewardPools = useMultiRewardPools()

  const multiRewardPool = useMemo(() => {
    return multiRewardPools
      .filter((x) => x.address.toLowerCase() === stakingAddress.toLowerCase())
      .find((x) => x.basePool.toLowerCase() === stakingInfo?.poolInfo.poolAddress.toLowerCase())
  }, [multiRewardPools, stakingAddress, stakingInfo?.poolInfo.poolAddress])

  const isTriple = multiRewardPool?.numRewards === 3

  const dualPool = useMultiStakeRewards(
    isTriple ? multiRewardPool?.underlyingPool : multiRewardPool?.address,
    stakingInfo,
    2,
    isTriple ? true : multiRewardPool?.active ?? false
  )
  const triplePool = useMultiStakeRewards(
    isTriple ? multiRewardPool?.address : undefined,
    dualPool,
    3,
    multiRewardPool?.active ?? false
  )
  return triplePool || dualPool
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
  const { network } = useCelo()
  const { chainId } = network
  const ube = chainId ? UBE[chainId as unknown as UbeswapChainId] : undefined
  const ubeContract = useTokenContract(ube?.address)
  const poolManagerContract = usePoolManagerContract(
    [ChainId.Mainnet, ChainId.Alfajores].includes(chainId) ? POOL_MANAGER[chainId] : undefined
  )
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
  const { network } = useCelo()
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
          if (stakingAddress) {
            return stakingAddress.toLowerCase() === stakingRewardInfo.stakingRewardAddress.toLowerCase()
          }
          if (pairToFilterBy === undefined) {
            return true
          }
          if (pairToFilterBy === null) {
            return false
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
  {
    index: -1,
    poolAddress: '0x478b8D37eE976228d17704d95B5430Cd93a31b87',
    stakingToken: '0x12E42ccf14B283Ef0a36A791892D18BF75Da5c80',
    rewardToken: '0x94140c2eA9D208D8476cA4E3045254169791C59e',
    rewardTokenSymbol: 'PREMIO',
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
  const { network } = useCelo()
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

      // Sometimes, decimals/name/symbol can be undefined, causing an error. TODO: Look into a root cause
      if (chainId && address && decimals && symbol && name) {
        const token = new Token(chainId, address, decimals, symbol, name)
        return [...memo, token]
      }
      return memo
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
  const { network } = useCelo()
  const { chainId } = network
  const ube = chainId ? UBE[chainId as unknown as UbeswapChainId] : undefined
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

export function useFilteredStakingInfo(stakingAddresses: string[]): readonly StakingInfo[] | undefined {
  const { network } = useCelo()
  const { chainId } = network
  const ube = chainId ? UBE[chainId as unknown as UbeswapChainId] : undefined
  const stakingInfos = useStakingInfo()
  return useMemo(() => {
    if (!ube) return
    return stakingInfos.filter(
      (stakingInfo) => stakingInfo.stakingToken.address && stakingAddresses.includes(stakingInfo.stakingToken.address)
    )
  }, [stakingInfos, ube, stakingAddresses])
}

export function useFarmRewardsInfo(stakingAddresses: string[]): readonly StakingInfo[] | undefined {
  const { network } = useCelo()
  const { chainId } = network
  const ube = chainId ? UBE[chainId as unknown as UbeswapChainId] : undefined
  const stakingInfos = useStakingInfo()
  return useMemo(() => {
    if (!ube) return
    return stakingInfos.filter(
      (stakingInfo) => stakingInfo.stakingToken.address && stakingAddresses.includes(stakingInfo.stakingToken.address)
    )
  }, [stakingInfos, ube, stakingAddresses])
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token | null | undefined,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: TokenAmount
  error?: string
} {
  const { address } = useCelo()

  const parsedInput: TokenAmount | undefined = tryParseAmount(typedValue, stakingToken ?? undefined)

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
  const { address } = useCelo()

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

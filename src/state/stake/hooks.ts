import { ChainId, JSBI, Pair, Token, TokenAmount } from '@ubeswap/sdk'
import { POOL_MANAGER } from 'constants/poolManager'
import { UBE } from 'constants/tokens'
import { BigNumber } from 'ethers'
import { PoolManager } from 'generated/'
import { useAllTokens } from 'hooks/Tokens'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { zip } from 'lodash'
// Hooks
import { useMemo } from 'react'
import useCUSDPrice from 'utils/useCUSDPrice'

import ERC_20_INTERFACE from '../../constants/abis/erc20'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
// Interfaces
import { UNISWAP_V2_PAIR_INTERFACE } from '../../constants/abis/uniswap-v2-pair'
import { useActiveWeb3React } from '../../hooks'
import { usePoolManagerContract, useTokenContract } from '../../hooks/useContract'
import {
  NEVER_RELOAD,
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
} from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'

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
  // the amount of reward token earned by the active account, or undefined if no account
  readonly earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  readonly totalStakedAmount: TokenAmount
  // the amount of token distributed per second to all LPs, constant
  readonly totalRewardRate: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  readonly rewardRate: TokenAmount
  // when the period ends
  readonly periodFinish: Date | undefined
  // if pool is active
  readonly active: boolean
  // calculates a hypothetical amount of token distributed to the active account per second.
  readonly getHypotheticalRewardRate: (
    stakedAmount: TokenAmount,
    totalStakedAmount: TokenAmount,
    totalRewardRate: TokenAmount
  ) => TokenAmount
  readonly nextPeriodRewards: TokenAmount
  readonly poolInfo: IRawPool
  readonly dollarRewardPerYear: TokenAmount | undefined
}

export const usePairStakingInfo = (pairToFilterBy?: Pair | null): StakingInfo | undefined => {
  return useStakingInfo(pairToFilterBy)[0] ?? undefined
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
  const { chainId } = useActiveWeb3React()
  const ube = chainId ? UBE[chainId] : undefined
  const ubeContract = useTokenContract(ube?.address)
  const poolManagerContract = usePoolManagerContract(chainId !== ChainId.BAKLAVA ? POOL_MANAGER[chainId] : undefined)
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
  const balanceRemaining = balances?.reduce((sum, b) => b.add(sum)) ?? null

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
    ? zip(rewardRates, periodFinishes).map(
        ([rate, finish]): BigNumber => {
          const rawRate = rate?.result?.[0] as BigNumber | undefined
          const finishTime = finish?.result?.[0] as BigNumber | undefined
          if (rawRate && finishTime && finishTime.gt(now)) {
            return rawRate.mul(finishTime.sub(now).toNumber())
          }
          return BigNumber.from(0)
        }
      )
    : undefined
  const earned =
    rewardRates?.[0]?.loading || !amounts ? null : amounts.reduce((sum, amt) => sum.add(amt), BigNumber.from(0))

  return {
    balanceRemaining,
    earned,
    noncirculatingSupply: balanceRemaining && earned ? balanceRemaining.sub(earned) : null,
  }
}

// gets the staking info from the network for the active chain id
export function useStakingInfo(pairToFilterBy?: Pair | null): readonly StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()
  const ubePrice = useCUSDPrice(UBE[chainId as ChainId])

  // detect if staking is ended
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  const info = useStakingPools(pairToFilterBy)

  const ube = chainId ? UBE[chainId] : undefined

  // These are the staking pools
  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'rewardRate',
    undefined,
    NEVER_RELOAD
  )

  const periodFinishes = useMultipleContractSingleData(
    rewardsAddresses,
    STAKING_REWARDS_INTERFACE,
    'periodFinish',
    undefined,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (!chainId || !ube) return []

    return info.reduce(
      (memo: StakingInfo[], { stakingRewardAddress: rewardsAddress, poolInfo, tokens }, index: number) => {
        // these two are dependent on account
        const balanceState = balances[index]
        const earnedAmountState = earnedAmounts[index]

        // these get fetched regardless of account
        const totalSupplyState = totalSupplies[index]
        const rewardRateState = rewardRates[index]
        const periodFinishState = periodFinishes[index]

        if (
          // these may be undefined if not logged in
          !balanceState?.loading &&
          !earnedAmountState?.loading &&
          // always need these
          totalSupplyState &&
          !totalSupplyState.loading &&
          rewardRateState &&
          !rewardRateState.loading &&
          periodFinishState &&
          !periodFinishState.loading
        ) {
          if (
            balanceState?.error ||
            earnedAmountState?.error ||
            totalSupplyState.error ||
            rewardRateState.error ||
            periodFinishState.error
          ) {
            console.error('Failed to load staking rewards info')
            return memo
          }

          // get the LP token
          const liquidityToken = new Token(chainId, poolInfo.stakingToken, 18, 'ULP', 'Ubeswap LP Token')

          // check for account, if no account set to 0
          const stakedAmount = new TokenAmount(liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
          const totalStakedAmount = new TokenAmount(liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))
          const totalRewardRate = new TokenAmount(ube, JSBI.BigInt(rewardRateState.result?.[0]))
          const nextPeriodRewards = new TokenAmount(ube, poolInfo.nextPeriodRewards?.toString() ?? '0')

          // tokens per month
          const ubePerYear = new TokenAmount(ube, JSBI.multiply(totalRewardRate.raw, JSBI.BigInt(365 * 24 * 60 * 60)))
          const dollarRewardPerYear = ubePrice?.quote(ubePerYear)

          const getHypotheticalRewardRate = (
            stakedAmount: TokenAmount,
            totalStakedAmount: TokenAmount,
            totalRewardRate: TokenAmount
          ): TokenAmount => {
            return new TokenAmount(
              ube,
              JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
                ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
                : JSBI.BigInt(0)
            )
          }

          const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)

          const periodFinishSeconds = periodFinishState.result?.[0]?.toNumber()
          const periodFinishMs = periodFinishSeconds * 1000

          // compare period end timestamp vs current block timestamp (in seconds)
          const active =
            periodFinishSeconds && currentBlockTimestamp ? periodFinishSeconds > currentBlockTimestamp.toNumber() : true

          if (!tokens) {
            return memo
          }

          memo.push({
            stakingRewardAddress: rewardsAddress,
            stakingToken: totalStakedAmount.token,
            tokens,
            periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
            earnedAmount: new TokenAmount(ube, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
            rewardRate: individualRewardRate,
            totalRewardRate: totalRewardRate,
            nextPeriodRewards,
            stakedAmount: stakedAmount,
            totalStakedAmount: totalStakedAmount,
            getHypotheticalRewardRate,
            active,
            poolInfo,
            dollarRewardPerYear,
          })
        }
        return memo
      },
      []
    )
  }, [
    balances,
    chainId,
    currentBlockTimestamp,
    earnedAmounts,
    info,
    periodFinishes,
    rewardRates,
    totalSupplies,
    ube,
    ubePrice,
  ])
}

interface IStakingPool {
  stakingRewardAddress: string
  tokens?: readonly [Token, Token]
  poolInfo: IRawPool
}

export function useStakingPools(pairToFilterBy?: Pair | null): readonly IStakingPool[] {
  const { chainId } = useActiveWeb3React()
  const ube = chainId ? UBE[chainId] : undefined

  const poolManagerContract = usePoolManagerContract(chainId !== ChainId.BAKLAVA ? POOL_MANAGER[chainId] : undefined)
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
        .filter((stakingRewardInfo) =>
          pairToFilterBy === undefined
            ? true
            : pairToFilterBy === null
            ? false
            : stakingRewardInfo.tokens &&
              pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
              pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
        ) ?? []
    )
  }, [ube, pools, poolPairs, pairToFilterBy])
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
  nextPeriod: number
  nextPeriodRewards: BigNumber | null
}

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
      : pools.map((p) => (p?.result as unknown) as IRawPool | undefined).filter((x): x is IRawPool => !!x)
  }, [pools])

  const nextPeriod = useSingleCallResult(poolManagerContract, 'nextPeriod')
  const poolRewards = useSingleContractMultipleData(
    poolManagerContract,
    'computeAmountForPool',
    rawPools.map((p) => [p.stakingToken, nextPeriod?.result?.[0]])
  )
  return rawPools.map((pool, i) => ({
    ...pool,
    nextPeriodRewards: poolRewards?.[i]?.result?.[0] ?? null,
  }))
}

export function usePairDataFromAddresses(
  pairAddresses: readonly string[]
): readonly (readonly [Token, Token] | undefined)[] {
  const { chainId } = useActiveWeb3React()

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
  const { chainId } = useActiveWeb3React()
  const ube = chainId ? UBE[chainId] : undefined
  const stakingInfos = useStakingInfo()

  return useMemo(() => {
    if (!ube) return undefined
    return (
      stakingInfos?.reduce(
        (accumulator, stakingInfo) => accumulator.add(stakingInfo.earnedAmount),
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
  const { account } = useActiveWeb3React()

  const parsedInput: TokenAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!account) {
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
  const { account } = useActiveWeb3React()

  const parsedInput: TokenAmount | undefined = tryParseAmount(typedValue, stakingAmount.token)

  const parsedAmount = parsedInput && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!account) {
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

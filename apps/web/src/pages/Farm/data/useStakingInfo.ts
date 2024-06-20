import { Interface } from '@ethersproject/abi'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import { UBE } from 'constants/tokens'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import JSBI from 'jsbi'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import STAKING_REWARDS_ABI from 'uniswap/src/abis/staking-rewards.json'
import { StakingInfo, useStakingPools } from './stakeHooks'

const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI)
const INT_SECONDS_IN_WEEK = 60 * 60 * 24 * 7

// Gets the staking info from the network for the active chain id
export default function useStakingInfo(pairToFilterBy?: Pair | null, stakingAddress?: string): readonly StakingInfo[] {
  const { account, chainId } = useWeb3React()
  const ube = chainId ? UBE[chainId] : undefined

  // detect if staking is ended
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  const info = useStakingPools(pairToFilterBy, stakingAddress)
  // These are the staking pools
  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? undefined], [account])

  // get all the info from the staking rewards contracts
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'rewardRate')
  const periodFinishes = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'periodFinish')
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

          const rewardToken = poolInfo.rewardToken
            ? new Token(chainId, poolInfo.rewardToken, 18, poolInfo.rewardTokenSymbol)
            : ube

          // get the LP token
          const liquidityToken = new Token(chainId, poolInfo.stakingToken, 18, 'ULP', 'Ubeswap LP Token')

          // check for account, if no account set to 0
          const stakedAmount = CurrencyAmount.fromRawAmount(liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
          const totalStakedAmount = CurrencyAmount.fromRawAmount(
            liquidityToken,
            JSBI.BigInt(totalSupplyState.result?.[0])
          )
          const nextPeriodRewards = CurrencyAmount.fromRawAmount(ube, poolInfo.nextPeriodRewards?.toString() ?? '0')

          const getHypotheticalRewardRate = (
            stakedAmount: CurrencyAmount<Token>,
            totalStakedAmount: CurrencyAmount<Token>,
            totalRewardRates: CurrencyAmount<Token>[]
          ): CurrencyAmount<Token>[] => {
            return [
              CurrencyAmount.fromRawAmount(
                rewardToken,
                JSBI.greaterThan(totalStakedAmount.quotient, JSBI.BigInt(0))
                  ? JSBI.divide(
                      JSBI.multiply(totalRewardRates[0].quotient, stakedAmount.quotient),
                      totalStakedAmount.quotient
                    )
                  : JSBI.BigInt(0)
              ),
            ]
          }

          const periodFinishSeconds = periodFinishState.result?.[0]?.toNumber()
          const periodFinishMs = periodFinishSeconds * 1000
          // compare period end timestamp vs current block timestamp (in seconds)
          const active =
            periodFinishSeconds && currentBlockTimestamp
              ? periodFinishSeconds > currentBlockTimestamp.toNumber()
              : false

          const rewardsFinished = Math.floor(Date.now() / 1000) - periodFinishSeconds > INT_SECONDS_IN_WEEK
          const totalRewardRate = CurrencyAmount.fromRawAmount(
            rewardToken,
            rewardsFinished ? JSBI.BigInt(0) : JSBI.BigInt(rewardRateState.result?.[0])
          )
          const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, [totalRewardRate])

          if (!tokens) {
            return memo
          }

          memo.push({
            stakingRewardAddress: rewardsAddress,
            stakingToken: totalStakedAmount.currency,
            tokens,
            stakedAmount,
            totalStakedAmount,
            earnedAmounts: [
              CurrencyAmount.fromRawAmount(rewardToken, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
            ],
            rewardRates: individualRewardRate,
            totalRewardRates: [totalRewardRate],
            periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
            active,
            getHypotheticalRewardRate,
            nextPeriodRewards,
            poolInfo,
            rewardTokens: [rewardToken],
          })
        }
        return memo
      },
      []
    )
  }, [balances, chainId, currentBlockTimestamp, earnedAmounts, info, periodFinishes, rewardRates, totalSupplies, ube])
}

// `stakingAddress` is used to differentiate when there are two different farms with the same LP
export const usePairStakingInfo = (pairToFilterBy?: Pair | null, stakingAddress?: string): StakingInfo | undefined => {
  return useStakingInfo(pairToFilterBy, stakingAddress)[0] ?? undefined
}

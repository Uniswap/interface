import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId as UbeswapChainId, JSBI, Pair, Token, TokenAmount } from '@ubeswap/sdk'
import { STAKING_REWARDS_INTERFACE } from 'constants/abis/staking-rewards'
import { UBE } from 'constants/tokens'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useMemo } from 'react'
import { NEVER_RELOAD, useMultipleContractSingleData } from 'state/multicall/hooks'

import { StakingInfo, useStakingPools } from './hooks'

// Gets the staking info from the network for the active chain id
export default function useStakingInfo(pairToFilterBy?: Pair | null): readonly StakingInfo[] {
  const { network, address } = useContractKit()
  const chainId = network.chainId as unknown as UbeswapChainId
  const ube = chainId ? UBE[chainId] : undefined

  // detect if staking is ended
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  const info = useStakingPools(pairToFilterBy)

  // These are the staking pools
  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [address ?? undefined], [address])

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

          const rewardToken = poolInfo.rewardToken
            ? new Token(chainId, poolInfo.rewardToken, 18, poolInfo.rewardTokenSymbol)
            : ube

          // get the LP token
          const liquidityToken = new Token(chainId, poolInfo.stakingToken, 18, 'ULP', 'Ubeswap LP Token')

          // check for account, if no account set to 0
          const stakedAmount = new TokenAmount(liquidityToken, JSBI.BigInt(balanceState?.result?.[0] ?? 0))
          const totalStakedAmount = new TokenAmount(liquidityToken, JSBI.BigInt(totalSupplyState.result?.[0]))
          const totalRewardRate = new TokenAmount(rewardToken, JSBI.BigInt(rewardRateState.result?.[0]))
          const nextPeriodRewards = new TokenAmount(ube, poolInfo.nextPeriodRewards?.toString() ?? '0')

          const getHypotheticalRewardRate = (
            stakedAmount: TokenAmount,
            totalStakedAmount: TokenAmount,
            totalRewardRates: TokenAmount[]
          ): TokenAmount[] => {
            return [
              new TokenAmount(
                rewardToken,
                JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
                  ? JSBI.divide(JSBI.multiply(totalRewardRates[0].raw, stakedAmount.raw), totalStakedAmount.raw)
                  : JSBI.BigInt(0)
              ),
            ]
          }

          const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, [totalRewardRate])

          const periodFinishSeconds = periodFinishState.result?.[0]?.toNumber()
          const periodFinishMs = periodFinishSeconds * 1000

          // compare period end timestamp vs current block timestamp (in seconds)
          const active =
            periodFinishSeconds && currentBlockTimestamp
              ? periodFinishSeconds > currentBlockTimestamp.toNumber()
              : false

          if (!tokens) {
            return memo
          }

          memo.push({
            stakingRewardAddress: rewardsAddress,
            stakingToken: totalStakedAmount.token,
            tokens,
            stakedAmount,
            totalStakedAmount,
            earnedAmounts: [new TokenAmount(rewardToken, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0))],
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

export const usePairStakingInfo = (pairToFilterBy?: Pair | null): StakingInfo | undefined => {
  return useStakingInfo(pairToFilterBy)[0] ?? undefined
}

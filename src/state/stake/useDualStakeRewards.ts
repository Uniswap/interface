import { Address } from '@celo/contractkit'
import { useContractKit } from '@celo-tools/use-contractkit'
import { BigNumber } from '@ethersproject/bignumber'
import { JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import { useToken } from 'hooks/Tokens'
import { useMultiStakingContract } from 'hooks/useContract'
import { zip } from 'lodash'
import { useMemo } from 'react'
import { useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'

import { StakingInfo } from './hooks'

export const useMultiStakeRewards = (
  address: Address | undefined,
  underlyingPool: StakingInfo | undefined | null,
  numRewards: number,
  active: boolean
): StakingInfo | null => {
  const { address: owner } = useContractKit()
  const accountArg = useMemo(() => [owner ?? undefined], [owner])
  const stakeRewards = useMultiStakingContract(address)

  const totalSupply = useSingleCallResult(stakeRewards, 'totalSupply', [])?.result?.[0]
  const rewardRate = useSingleCallResult(stakeRewards, 'rewardRate', [])?.result?.[0]
  const rewardsToken = useToken(useSingleCallResult(stakeRewards, 'rewardsToken', [])?.result?.[0])
  const externalRewardsTokens: Record<string, number> = useSingleContractMultipleData(
    stakeRewards,
    'externalRewardsTokens',
    [...[...Array(numRewards - 2).keys()].map((i) => [i])]
  )
    ?.map((cr) => cr?.result as unknown as string)
    .reduce((acc, curr, idx) => ({ ...acc, [curr]: idx }), {})

  const stakeBalance = useSingleCallResult(stakeRewards, 'balanceOf', accountArg)?.result?.[0]
  const earned = useSingleCallResult(stakeRewards, 'earned', accountArg)?.result?.[0]
  const earnedExternal = useSingleCallResult(stakeRewards, 'earnedExternal', accountArg)?.result?.[0]

  const data = useMemo(
    () => ({
      totalSupply,
      rewardRate,
      rewardsToken,
      myBalance: stakeBalance,
      earned: [earned, ...(earnedExternal ? earnedExternal : [])],
    }),
    [earned, earnedExternal, rewardRate, rewardsToken, stakeBalance, totalSupply]
  )

  return useMemo((): StakingInfo | null => {
    if (!data || !rewardsToken || !underlyingPool) {
      return null
    }
    const { totalSupply: totalSupplyRaw, rewardRate: totalRewardRateRaw, myBalance, earned } = data
    const { stakingToken } = underlyingPool

    const getHypotheticalRewardRate = (
      stakedAmount: TokenAmount,
      totalStakedAmount: TokenAmount,
      totalRewardRates: TokenAmount[]
    ): TokenAmount[] => {
      return totalRewardRates.map((totalRewardRate) => {
        return new TokenAmount(
          totalRewardRate.token,
          JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
            ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
            : JSBI.BigInt(0)
        )
      })
    }

    const stakedAmount = myBalance ? new TokenAmount(stakingToken, myBalance?.toString() ?? '0') : undefined
    const totalStakedAmount = new TokenAmount(stakingToken, totalSupplyRaw?.toString() ?? '0')
    const totalRewardRates = [
      new TokenAmount(rewardsToken, totalRewardRateRaw?.toString() ?? '0'),
      ...underlyingPool.totalRewardRates,
    ].sort((a, b) => (a.token?.symbol && b?.token?.symbol ? a.token.symbol.localeCompare(b.token.symbol) : 0))

    const rewardRates = stakedAmount
      ? getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRates)
      : totalRewardRates.map((totalRewardRate) => new TokenAmount(totalRewardRate.token, '0'))

    const underlyingRewardTokens = underlyingPool.rewardTokens.sort(
      (a, b) => externalRewardsTokens[a?.address] - externalRewardsTokens[b?.address]
    )
    const rewardTokens = rewardsToken ? [rewardsToken, ...underlyingRewardTokens] : [...underlyingRewardTokens]
    const earnedAmounts =
      earned && earned.length === rewardTokens.length
        ? zip<BigNumber, Token>(earned, rewardTokens)
            .map(([amount, token]) => new TokenAmount(token as Token, amount?.toString() ?? '0'))
            .sort((a, b) => (a?.token?.symbol && b?.token?.symbol ? a.token.symbol.localeCompare(b.token.symbol) : 0))
        : undefined

    return {
      stakingRewardAddress: address,
      stakingToken,
      tokens: underlyingPool.tokens,
      stakedAmount,
      totalStakedAmount,
      earnedAmounts,
      rewardRates,
      totalRewardRates,
      periodFinish: new Date(),
      active,
      getHypotheticalRewardRate,
      nextPeriodRewards: underlyingPool.nextPeriodRewards,
      poolInfo: underlyingPool.poolInfo,
      rewardTokens,
    }
  }, [data, rewardsToken, underlyingPool, address, active, externalRewardsTokens])
}

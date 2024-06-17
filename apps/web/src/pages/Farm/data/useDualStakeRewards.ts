import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useToken } from 'hooks/Tokens'
import { useMoolaStakingRewardsContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import zip from 'lodash/zip'
import { useMemo } from 'react'
import { StakingInfo } from './stakeHooks'

const INT_SECONDS_IN_WEEK = 60 * 60 * 24 * 7

export const useMultiStakeRewards = (
  address: Address | undefined,
  underlyingPool: StakingInfo | undefined | null,
  numRewards: number,
  active: boolean
): StakingInfo | null => {
  const { account: owner } = useWeb3React()
  const accountArg = useMemo(() => [owner ?? undefined], [owner])
  const stakeRewards = useMoolaStakingRewardsContract(address)

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
  const periodFinish = useSingleCallResult(stakeRewards, 'periodFinish', [])?.result?.[0]
  const data = useMemo(
    () => ({
      totalSupply,
      rewardRate,
      rewardsToken,
      periodFinish,
      myBalance: stakeBalance,
      earned: [earned, ...(earnedExternal ? earnedExternal : [])],
    }),
    [earned, earnedExternal, rewardRate, rewardsToken, stakeBalance, totalSupply, periodFinish]
  )

  return useMemo((): StakingInfo | null => {
    if (!data || !rewardsToken || !underlyingPool) {
      return null
    }
    const { totalSupply: totalSupplyRaw, rewardRate: totalRewardRateRaw, myBalance, earned, periodFinish } = data
    const { stakingToken } = underlyingPool

    const getHypotheticalRewardRate = (
      stakedAmount: CurrencyAmount<Token>,
      totalStakedAmount: CurrencyAmount<Token>,
      totalRewardRates: CurrencyAmount<Token>[]
    ): CurrencyAmount<Token>[] => {
      return totalRewardRates.map((totalRewardRate) => {
        return CurrencyAmount.fromRawAmount(
          totalRewardRate.currency,
          JSBI.greaterThan(totalStakedAmount.quotient, JSBI.BigInt(0))
            ? JSBI.divide(JSBI.multiply(totalRewardRate.quotient, stakedAmount.quotient), totalStakedAmount.quotient)
            : JSBI.BigInt(0)
        )
      })
    }

    const rewardsFinished = Math.floor(Date.now() / 1000) - periodFinish.toNumber() > INT_SECONDS_IN_WEEK
    const stakedAmount = myBalance
      ? CurrencyAmount.fromRawAmount(stakingToken, myBalance?.toString() ?? '0')
      : undefined
    const totalStakedAmount = CurrencyAmount.fromRawAmount(stakingToken, totalSupplyRaw?.toString() ?? '0')
    const totalRewardRates = [
      CurrencyAmount.fromRawAmount(
        rewardsToken,
        rewardsFinished ? JSBI.BigInt(0) : totalRewardRateRaw?.toString() ?? '0'
      ),
      ...underlyingPool.totalRewardRates,
    ].sort((a, b) =>
      a.currency?.symbol && b?.currency?.symbol ? a.currency.symbol.localeCompare(b.currency.symbol) : 0
    )

    const rewardRates = stakedAmount
      ? getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRates)
      : totalRewardRates.map((totalRewardRate) => CurrencyAmount.fromRawAmount(totalRewardRate.currency, '0'))

    const underlyingRewardTokens = underlyingPool.rewardTokens.sort(
      (a, b) => externalRewardsTokens[a?.address] - externalRewardsTokens[b?.address]
    )
    const rewardTokens = rewardsToken ? [rewardsToken, ...underlyingRewardTokens] : [...underlyingRewardTokens]
    const earnedAmounts =
      earned && earned.length === rewardTokens.length
        ? zip<BigNumber, Token>(earned, rewardTokens)
            .map(([amount, token]) => CurrencyAmount.fromRawAmount(token as Token, amount?.toString() ?? '0'))
            .sort((a, b) =>
              a?.currency?.symbol && b?.currency?.symbol ? a.currency.symbol.localeCompare(b.currency.symbol) : 0
            )
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

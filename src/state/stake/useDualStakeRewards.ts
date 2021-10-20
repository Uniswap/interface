import { Address } from '@celo/contractkit'
import { useContractKit } from '@celo-tools/use-contractkit'
import { BigNumber } from '@ethersproject/bignumber'
import { JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import { useToken } from 'hooks/Tokens'
import { useMultiStakingContract } from 'hooks/useContract'
import { zip } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'

import { StakingInfo } from './hooks'

interface RawPoolData {
  totalSupply: BigNumber
  rewardRate: BigNumber
  rewardsToken: string
  myBalance?: BigNumber
  earned?: BigNumber[]
}

export const useMultiStakeRewards = (
  address: Address,
  underlyingPool: StakingInfo | undefined | null,
  numRewards: number,
  active: boolean
): StakingInfo | null => {
  const { address: owner } = useContractKit()
  const stakeRewards = useMultiStakingContract(address)

  const [data, setData] = useState<RawPoolData | null>(null)

  const blockNumber = useBlockNumber()

  const load = useCallback(async (): Promise<RawPoolData | null> => {
    if (!stakeRewards) {
      return null
    }

    try {
      const totalSupply = await stakeRewards.callStatic.totalSupply()
      const rewardRate = await stakeRewards.callStatic.rewardRate()
      const rewardsToken = await stakeRewards.callStatic.rewardsToken()

      const amts = { totalSupply, rewardRate, rewardsToken } as const

      if (!owner) {
        return amts
      }

      const result = await Promise.all([
        stakeRewards.callStatic.balanceOf(owner),
        stakeRewards.callStatic.earned(owner),
        Promise.all(
          new Array(numRewards - 1)
            .fill(0)
            .map((_, idx) => stakeRewards.callStatic.earnedExternal(owner).then((v) => v[idx]))
        ),
      ])
      return {
        ...amts,
        myBalance: result[0],
        earned: [result[1], ...result[2]],
      }
    } catch (e) {
      console.error(e, blockNumber) // Force usage of blockNumber so that we are refreshing
      return null
    }
  }, [owner, stakeRewards, numRewards, blockNumber])

  useEffect(() => {
    void (async () => {
      setData(await load())
    })()
  }, [load])

  const rewardsToken = useToken(data?.rewardsToken)

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

    const stakedAmount = myBalance ? new TokenAmount(stakingToken, myBalance.toString()) : undefined
    const totalStakedAmount = new TokenAmount(stakingToken, totalSupplyRaw.toString())
    const totalRewardRates = [
      new TokenAmount(rewardsToken, totalRewardRateRaw.toString()),
      ...underlyingPool.totalRewardRates,
    ].sort((a, b) => (a.token?.symbol && b?.token?.symbol ? a.token.symbol.localeCompare(b.token.symbol) : 0))

    const rewardRates = stakedAmount
      ? getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRates)
      : totalRewardRates.map((totalRewardRate) => new TokenAmount(totalRewardRate.token, '0'))

    const rewardTokens = [rewardsToken, ...underlyingPool.rewardTokens].sort((a, b) =>
      a?.symbol && b?.symbol ? a.symbol.localeCompare(b.symbol) : 0
    )
    const earnedAmounts = earned
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
  }, [address, data, rewardsToken, underlyingPool, active])
}

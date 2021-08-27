import { Address } from '@celo/contractkit'
import { useContractKit } from '@celo-tools/use-contractkit'
import { BigNumber } from '@ethersproject/bignumber'
import { JSBI, TokenAmount } from '@ubeswap/sdk'
import { UBE } from 'constants/tokens'
import { useToken } from 'hooks/Tokens'
import { useDualStakingContract } from 'hooks/useContract'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useCUSDPrice from 'utils/useCUSDPrice'

import { StakingInfo } from './hooks'

export type DualRewardsInfo = StakingInfo & {
  /**
   * External earned amount. (UBE)
   */
  earnedAmountUbe: TokenAmount

  ubeRewardRate: TokenAmount
  totalUBERewardRate: TokenAmount

  ubeDollarRewardPerYear?: TokenAmount
  rewardsDollarRewardPerYear?: TokenAmount
}

interface RawPoolData {
  totalSupply: BigNumber
  rewardRate: BigNumber
  rewardsToken: string
  myBalance?: BigNumber
  earned?: BigNumber
  earnedExternal?: BigNumber
}

export const useDualStakeRewards = (
  address: Address,
  underlyingPool: StakingInfo | undefined,
  owner: Address | null | undefined
): DualRewardsInfo | null => {
  const { network } = useContractKit()
  const { chainId } = network
  const stakeRewards = useDualStakingContract(address)

  const [data, setData] = useState<RawPoolData | null>(null)

  const ube = chainId ? UBE[chainId] : undefined

  const load = useCallback(async (): Promise<RawPoolData | null> => {
    if (!stakeRewards) {
      return null
    }

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
      stakeRewards.callStatic.earnedExternal(owner).then((v) => v[0]), // Hardcode: Only 1 external reward
    ])
    return { ...amts, myBalance: result[0], earned: result[1], earnedExternal: result[2] }
  }, [owner, stakeRewards])

  useEffect(() => {
    void (async () => {
      setData(await load())
    })()
  }, [load])

  const rewardsToken = useToken(data?.rewardsToken)
  const rewardsPrice = useCUSDPrice(rewardsToken ?? undefined)

  return useMemo((): DualRewardsInfo | null => {
    if (!data || !rewardsToken || !ube || !underlyingPool) {
      return null
    }
    const { totalSupply: totalSupplyRaw, rewardRate: totalRewardRateRaw, myBalance, earned, earnedExternal } = data
    const { stakingToken } = underlyingPool

    const getHypotheticalRewardRate = (
      stakedAmount: TokenAmount,
      totalStakedAmount: TokenAmount,
      totalRewardRate: TokenAmount
    ): TokenAmount => {
      return new TokenAmount(
        rewardsToken,
        JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
          ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmount.raw), totalStakedAmount.raw)
          : JSBI.BigInt(0)
      )
    }

    const stakedAmount = myBalance ? new TokenAmount(stakingToken, myBalance.toString()) : undefined
    const totalStakedAmount = new TokenAmount(stakingToken, totalSupplyRaw.toString())
    const totalRewardRate = new TokenAmount(rewardsToken, totalRewardRateRaw.toString())
    const totalUBERewardRate = underlyingPool.totalRewardRate

    const ubeRewardRate = stakedAmount
      ? underlyingPool.getHypotheticalRewardRate(stakedAmount, totalStakedAmount, underlyingPool.totalRewardRate)
      : new TokenAmount(ube, '0')
    const rewardRate = stakedAmount
      ? getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)
      : new TokenAmount(totalRewardRate.token, '0')

    const ubeDollarRewardPerYear = underlyingPool.dollarRewardPerYear

    const rewardsPerYear = new TokenAmount(
      rewardsToken,
      JSBI.multiply(totalRewardRate.raw, JSBI.BigInt(365 * 24 * 60 * 60))
    )
    const rewardsDollarRewardPerYear = rewardsPrice?.quote(rewardsPerYear)

    const dollarRewardPerYear = rewardsDollarRewardPerYear
      ? ubeDollarRewardPerYear?.add(rewardsDollarRewardPerYear)
      : undefined

    return {
      stakingRewardAddress: address,
      stakingToken,
      stakedAmount,
      earnedAmount: new TokenAmount(ube, earned?.toString() ?? '0'),
      earnedAmountUbe: new TokenAmount(ube, earnedExternal?.toString() ?? '0'),

      rewardRate,
      ubeRewardRate,

      totalRewardRate,
      totalUBERewardRate,

      totalStakedAmount,
      periodFinish: new Date(),
      active: true,
      getHypotheticalRewardRate,

      dollarRewardPerYear,
      ubeDollarRewardPerYear,
      rewardsDollarRewardPerYear,

      tokens: underlyingPool.tokens,
      nextPeriodRewards: underlyingPool.nextPeriodRewards,
      poolInfo: underlyingPool.poolInfo,
      rewardToken: rewardsToken,
      dualRewards: true,
    }
  }, [address, data, rewardsToken, ube, underlyingPool, rewardsPrice])
}

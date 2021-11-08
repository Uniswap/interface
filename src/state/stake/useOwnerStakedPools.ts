import { useContractKit } from '@celo-tools/use-contractkit'
import { Interface } from '@ethersproject/abi'
import { JSBI } from '@ubeswap/sdk'
import { partition } from 'lodash'
import { useMemo } from 'react'
import { useMultipleContractSingleData } from 'state/multicall/hooks'

import { BIG_INT_ZERO } from '../../constants'
import DUAL_REWARDS_ABI from '../../constants/abis/moola/MoolaStakingRewards.json'
import { MultiRewardPool, multiRewardPools } from './farms'
import { StakingInfo } from './hooks'

const isStakedPool = (pool: StakingInfo) => {
  return Boolean(pool.stakedAmount && JSBI.greaterThan(pool.stakedAmount.raw, BIG_INT_ZERO))
}

// get all staked pools
export const useOwnerStakedPools = (allPools: StakingInfo[]) => {
  const { address: owner } = useContractKit()

  const multiRewards = useMemo(
    () =>
      multiRewardPools.map((multiPool) => {
        return [multiPool, allPools.find((pool) => pool.poolInfo.poolAddress === multiPool.basePool)]
      }) as [MultiRewardPool, StakingInfo | undefined][],
    [allPools]
  )

  const data = useMultipleContractSingleData(
    multiRewards.map((mr) => mr[0].address),
    new Interface(DUAL_REWARDS_ABI),
    'balanceOf',
    [owner || undefined]
  )

  const isStaked: Record<string, boolean> = data.reduce((acc, curr, idx) => {
    return { ...acc, [multiRewards[idx][0].address]: curr?.result?.[0].gt('0') }
  }, {})

  const [stakedPools, unstakedPools] = useMemo(() => {
    return partition(allPools, isStakedPool)
  }, [allPools])

  const [stakedMultiPools, unstakedMultiPools] = partition(multiRewards || [], (p) => isStaked[p[0].address])

  return { stakedMultiPools, unstakedMultiPools, stakedPools, unstakedPools }
}

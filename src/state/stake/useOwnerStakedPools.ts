import { useContractKit } from '@celo-tools/use-contractkit'
import { Interface } from '@ethersproject/abi'
import partition from 'lodash/partition'
import { FarmSummary } from 'pages/Earn/useFarmRegistry'
import { useMemo } from 'react'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { toBN } from 'web3-utils'

import DUAL_REWARDS_ABI from '../../constants/abis/moola/MoolaStakingRewards.json'

// get all staked pools
export const useOwnerStakedPools = (farmSummaries: FarmSummary[]) => {
  const { address: owner } = useContractKit()

  const data = useMultipleContractSingleData(
    farmSummaries.map((farmSummaries) => farmSummaries.stakingAddress),
    new Interface(DUAL_REWARDS_ABI),
    'balanceOf',
    [owner || undefined]
  )

  const isStaked: Record<string, boolean> = data.reduce<Record<string, boolean>>((acc, curr, idx) => {
    acc[farmSummaries[idx].stakingAddress] = curr?.result?.[0].gt('0')
    return acc
  }, {})

  const [stakedFarms, uniqueUnstakedFarms] = useMemo(() => {
    const [staked, unstaked] = partition(farmSummaries, (farmSummary) => isStaked[farmSummary.stakingAddress])
    return [staked, unique(unstaked)]
  }, [farmSummaries, isStaked])

  return { stakedFarms, unstakedFarms: uniqueUnstakedFarms }
}

function unique(farmSummaries: FarmSummary[]): FarmSummary[] {
  const bestFarms: Record<string, FarmSummary> = {}
  farmSummaries.forEach((fs) => {
    if (!bestFarms[fs.lpAddress]) {
      bestFarms[fs.lpAddress] = fs
    }
    const currentBest = bestFarms[fs.lpAddress]
    if (toBN(fs.rewardsUSDPerYear).gt(toBN(currentBest.rewardsUSDPerYear))) {
      bestFarms[fs.lpAddress] = fs
    }
  })
  return Object.values(bestFarms)
}

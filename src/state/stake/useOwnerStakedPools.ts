import { useContractKit } from '@celo-tools/use-contractkit'
import { Interface } from '@ethersproject/abi'
import { partition } from 'lodash'
import { FarmSummary } from 'pages/Earn/useFarmRegistry'
import { useMemo } from 'react'
import { useMultipleContractSingleData } from 'state/multicall/hooks'

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

  const [stakedFarms, unstakedFarms] = useMemo(() => {
    return partition(farmSummaries, (farmSummary) => isStaked[farmSummary.stakingAddress])
  }, [farmSummaries, isStaked])

  return { stakedFarms, unstakedFarms }
}

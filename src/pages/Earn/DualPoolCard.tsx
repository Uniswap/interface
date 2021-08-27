import { useContractKit } from '@celo-tools/use-contractkit'
import { PoolCard } from 'components/earn/PoolCard'
import Loader from 'components/Loader'
import React from 'react'
import { StakingInfo } from 'state/stake/hooks'
import { useDualStakeRewards } from 'state/stake/useDualStakeRewards'

interface Props {
  poolAddress: string
  underlyingPool: StakingInfo
}

export const DualPoolCard: React.FC<Props> = ({ poolAddress, underlyingPool }: Props) => {
  const { address } = useContractKit()
  const mooPool = useDualStakeRewards(poolAddress, underlyingPool, address ?? null)

  if (!mooPool) {
    return <Loader />
  }

  return <PoolCard stakingInfo={mooPool} dualRewards={mooPool} />
}

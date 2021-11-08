import { PoolCard } from 'components/earn/PoolCard'
import Loader from 'components/Loader'
import React from 'react'
import { StakingInfo } from 'state/stake/hooks'
import { useMultiStakeRewards } from 'state/stake/useDualStakeRewards'

interface Props {
  poolAddress: string
  dualPoolAddress: string
  underlyingPool: StakingInfo
  active: boolean
}

export const TriplePoolCard: React.FC<Props> = ({ poolAddress, dualPoolAddress, underlyingPool, active }: Props) => {
  const dualPool = useMultiStakeRewards(dualPoolAddress, underlyingPool, true)
  const mooPool = useMultiStakeRewards(poolAddress, dualPool, active)

  if (!mooPool) {
    return <Loader />
  }

  return <PoolCard stakingInfo={mooPool} />
}

import { PoolCard } from 'components/earn/PoolCard'
import Loader from 'components/Loader'
import React from 'react'
import { StakingInfo } from 'state/stake/hooks'
import { useMultiStakeRewards } from 'state/stake/useDualStakeRewards'

interface Props {
  poolAddress: string
  dualPoolAddress: string
  underlyingPool: StakingInfo
}

export const TriplePoolCard: React.FC<Props> = ({ poolAddress, dualPoolAddress, underlyingPool }: Props) => {
  const dualPool = useMultiStakeRewards(dualPoolAddress, underlyingPool, 2)
  const mooPool = useMultiStakeRewards(poolAddress, dualPool, 3)

  if (!mooPool) {
    return <Loader />
  }

  return <PoolCard stakingInfo={mooPool} />
}

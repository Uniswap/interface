import { PoolCard } from 'components/earn/PoolCard'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import React from 'react'
import { StakingInfo } from 'state/stake/hooks'
import { useDualStakeRewards } from 'state/stake/useDualStakeRewards'

interface Props {
  poolAddress: string
  underlyingPool: StakingInfo
}

export const ExternalPoolCard: React.FC<Props> = ({ poolAddress, underlyingPool }: Props) => {
  const { account } = useActiveWeb3React()
  const mooPool = useDualStakeRewards(poolAddress, underlyingPool, account ?? null)

  if (!mooPool) {
    return <Loader />
  }

  return <PoolCard stakingInfo={mooPool} dualRewards={mooPool} />
}

import React, { Fragment } from 'react'

// import { CurrencyAmount, Token } from 'sdk-core/entities'

// import { DoubleCurrencyLogo } from 'components/DoubleLogo/DoubleCurrencyLogo.stories'
// import { Link } from 'react-router-dom'
// import StakingModal from 'components/farm/StakingModal'
// import UnstakingModal from 'components/farm/UnstakingModal'
// import { isTruthy } from 'utils/isTruthy'

import JSBI from 'jsbi'
// import CurrencyLogo from 'components/CurrencyLogo'
import { FarmTable, FarmTableRow } from 'components/farm/FarmTable'

import { MinichefRawPoolInfo, useCalculateAPR, usePairTokens, usePools, useRewardInfos } from 'state/farm/farm-hooks'
import useUSDCPrice from 'hooks/useUSDCPrice'

import styled from 'styled-components'
import { Tux } from '../../components/farm/TuxBanner'
import { FarmHeading } from '../../components/farm/FarmHeading'
import { HRDark } from '../../components/HR/HR'

const FarmListContainer = styled.div`
  max-width: 1080px;
  width: 100%;
`

export function FarmListPage() {
  const pools = usePools()

  return (
    <FarmListContainer>
      <Tux />
      <FarmHeading />
      {/* {pools.map((pool) => pool.lpTokenAddress && <Pool key={pool.lpTokenAddress} {...pool} />).filter(isTruthy)} */}
      <FarmTable>
        {pools.map((pool) => (
          <Fragment key={pool.poolId}>
            <HRDark />
            <PoolRow {...pool} />
          </Fragment>
        ))}
      </FarmTable>
    </FarmListContainer>
  )
}

type PoolProps = MinichefRawPoolInfo

function PoolRow({
  lpTokenAddress,
  poolId,
  // pendingAmount,
  rewarderAddress,
  // stakedRawAmount,
  poolEmissionAmount,
}: PoolProps) {
  const { totalPoolStaked, pair } = usePairTokens(lpTokenAddress)
  const USDPrice = useUSDCPrice(totalPoolStaked?.currency)
  const { rewardPerSecondAmount } = useRewardInfos(poolId, rewarderAddress)
  const primaryAPR = useCalculateAPR(poolEmissionAmount, totalPoolStaked)
  const secondaryAPR = useCalculateAPR(rewardPerSecondAmount, totalPoolStaked)
  const totalAPR = JSBI.add(primaryAPR || JSBI.BigInt(0), secondaryAPR || JSBI.BigInt(0))

  const valueOfTotalStakedAmountInUSDC = totalPoolStaked && USDPrice?.quote(totalPoolStaked)

  return (
    <>
      <FarmTableRow
        pair={pair ?? undefined}
        poolId={poolId}
        tlv={valueOfTotalStakedAmountInUSDC}
        totalLPStaked={totalPoolStaked}
        primaryEmissionPerSecond={poolEmissionAmount}
        secondaryEmissionPerSecond={rewardPerSecondAmount}
        totalAPR={totalAPR}
      />
    </>
  )
}

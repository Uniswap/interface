import React from 'react'

import { UpcomingPool } from 'constants/upcoming-pools'
import { PoolTokensWrapper, PoolTokensText, HigherLogo, CoveredLogo } from './styled'

const PoolTokens = ({ pool }: { pool: UpcomingPool }) => {
  return (
    <PoolTokensWrapper>
      <HigherLogo src={pool.poolToken1Logo} alt="poolToken1Logo" width="16px" height="16px" />
      <CoveredLogo src={pool.poolToken2Logo} alt="poolToken2Logo" width="16px" height="16px" />
      <PoolTokensText>{`${pool.poolToken1Symbol}-${pool.poolToken2Symbol}`}</PoolTokensText>
    </PoolTokensWrapper>
  )
}

export default PoolTokens

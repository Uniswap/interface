import Column from 'components/Column'
import Row from 'components/Row'
import { getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { usePoolData } from 'graphql/thegraph/PoolData'
import NotFound from 'pages/NotFound'
import { useReducer } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { isAddress } from 'utils'

import { PoolDetailsHeader } from './PoolDetailsHeader'
import { PoolDetailsStats } from './PoolDetailsStats'

const PageWrapper = styled(Row)`
  padding: 48px;
  width: 100%;
  align-items: flex-start;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: column;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: 48px 16px;
  }
`

const RightColumn = styled(Column)`
  gap: 24px;
  margin: 0 48px 0 auto;
  width: 22vw;
  min-width: 360px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    margin: 44px 0px;
    width: 100%;
    min-width: unset;
  }
`

export default function PoolDetailsPage() {
  const { poolAddress, chainName } = useParams<{
    poolAddress: string
    chainName: string
  }>()
  const chain = getValidUrlChainName(chainName)
  const chainId = chain && supportedChainIdFromGQLChain(chain)
  const { data: poolData, loading } = usePoolData(poolAddress ?? '', chainId)
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)
  const token0 = isReversed ? poolData?.token1 : poolData?.token0
  const token1 = isReversed ? poolData?.token0 : poolData?.token1
  const isInvalidPool = !chainName || !poolAddress || !getValidUrlChainName(chainName) || !isAddress(poolAddress)
  const poolNotFound = (!loading && !poolData) || isInvalidPool

  // TODO(WEB-2814): Add skeleton once designed
  if (loading) return null
  if (poolNotFound) return <NotFound />
  return (
    <PageWrapper>
      <PoolDetailsHeader
        chainId={chainId}
        poolAddress={poolAddress}
        token0={token0}
        token1={token1}
        feeTier={poolData?.feeTier}
        toggleReversed={toggleReversed}
      />
      <RightColumn>
        {poolData && <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainId} />}
      </RightColumn>
    </PageWrapper>
  )
}

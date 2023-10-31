import Column from 'components/Column'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
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
import { PoolDetailsStatsButtons } from './PoolDetailsStatsButtons'
import { PoolDetailsTableSkeleton } from './PoolDetailsTableSkeleton'
import { DetailBubble, SmallDetailBubble } from './shared'

const PageWrapper = styled(Row)`
  padding: 48px;
  width: 100%;
  align-items: flex-start;
  gap: 60px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: column;
    gap: unset;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: 48px 16px;
  }
`

const LeftColumn = styled(Column)`
  gap: 24px;
  width: 65vw;
  overflow: hidden;
  justify-content: flex-start;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    width: 100%;
  }
`

const HR = styled.hr`
  border: 0.5px solid ${({ theme }) => theme.surface3};
  margin: 16px 0px;
  width: 100%;
`

const ChartHeaderBubble = styled(LoadingBubble)`
  width: 180px;
  height: 32px;
`

const LinkColumn = styled(Column)`
  gap: 16px;
  padding: 20px;
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

  if (poolNotFound) return <NotFound />
  return (
    <PageWrapper>
      <LeftColumn>
        <Column gap="sm">
          <PoolDetailsHeader
            chainId={chainId}
            poolAddress={poolAddress}
            token0={token0}
            token1={token1}
            feeTier={poolData?.feeTier}
            toggleReversed={toggleReversed}
            loading={loading}
          />
          <LoadingChart />
        </Column>
        <HR />
        <ChartHeaderBubble />
        <PoolDetailsTableSkeleton />
      </LeftColumn>
      <RightColumn>
        <PoolDetailsStatsButtons
          chainId={chainId}
          token0={token0}
          token1={token1}
          feeTier={poolData?.feeTier}
          loading={loading}
        />
        <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainId} loading={loading} />
        {(token0 || token1 || loading) &&
          (loading ? (
            <LinkColumn data-testid="pdp-links-loading-skeleton">
              <DetailBubble $height={24} $width={116} />
              {Array.from({ length: 3 }).map((_, i) => (
                <Row gap="8px" key={`loading-link-row-${i}`}>
                  <SmallDetailBubble />
                  <DetailBubble $width={117} />
                </Row>
              ))}
            </LinkColumn>
          ) : null)}
        {/* TODO(WEB-2985) replace with new Token Links component */}
      </RightColumn>
    </PageWrapper>
  )
}

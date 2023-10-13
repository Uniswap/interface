import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { usePoolData } from 'graphql/thegraph/PoolData'
import { useReducer } from 'react'
import { ArrowDown } from 'react-feather'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import { isAddress } from 'utils'

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

const TokenDetailsWrapper = styled(Column)`
  gap: 24px;
  padding: 20px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.sm}px) {
    flex-direction: row;
    flex-wrap: wrap;
    padding: unset;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: unset;
  }
`

const TokenDetailsHeader = styled(Text)`
  width: 100%;
  font-size: 24px;
  font-weight: 485;
  line-height: 32px;
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
  return (
    <PageWrapper>
      <PoolDetailsLoadingSkeleton />
    </PageWrapper>
  )
  // if (poolNotFound) return <NotFound />
  // return (
  //   <PageWrapper>
  //     <PoolDetailsHeader
  //       chainId={chainId}
  //       poolAddress={poolAddress}
  //       token0={token0}
  //       token1={token1}
  //       feeTier={poolData?.feeTier}
  //       toggleReversed={toggleReversed}
  //     />
  //     <RightColumn>
  //       <PoolDetailsStatsButtons chainId={chainId} token0={token0} token1={token1} feeTier={poolData?.feeTier} />
  //       {poolData && <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainId} />}
  //       {(token0 || token1) && (
  //         <TokenDetailsWrapper>
  //           <TokenDetailsHeader>
  //             <Trans>Info</Trans>
  //           </TokenDetailsHeader>
  //           {token0 && <TokenDescription tokenAddress={token0.id} chainId={chainId} />}
  //           {token1 && <TokenDescription tokenAddress={token1.id} chainId={chainId} />}
  //         </TokenDetailsWrapper>
  //       )}
  //     </RightColumn>
  //   </PageWrapper>
  // )
}

const LeftColumn = styled(Column)`
  gap: 24px;
  width: 65vw;
`

const DetailBubble = styled(LoadingBubble)`
  height: 16px;
  width: 80px;
`

const RouteBubble = styled(DetailBubble)`
  width: 300px;
`

const IconBubble = styled(LoadingBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`

const TokenNameBubble = styled(DetailBubble)`
  width: 137px;
`

const TVLBubble = styled(LoadingBubble)`
  width: 180px;
  height: 40px;
`

const ChartSkeleton = styled.div`
  height: 462px;
`

const HR = styled.hr`
  border: 1px solid ${({ theme }) => theme.surface3};
  margin: 16px 0px;
  width: 100%;
`

const ChartHeaderBubble = styled(LoadingBubble)`
  width: 180px;
  height: 32px;
`

const Table = styled(Column)`
  gap: 24px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  padding-bottom: 12px;
  overflow-y: hidden;
  ${ScrollBarStyles}
`

const TableRow = styled(Row)<{ $borderBottom?: boolean }>`
  justify-content: space-between;
  border-bottom: ${({ $borderBottom, theme }) => ($borderBottom ? `1px solid ${theme.surface3}` : 'none')}};
  padding: 12px;
  min-width: max-content;
`

const TableElement = styled(ThemedText.BodySecondary)<{
  alignRight?: boolean
  small?: boolean
  large?: boolean
}>`
  display: flex;
  padding: 0px 8px;
  flex: ${({ small }) => (small ? 'unset' : '1')};
  width: ${({ small }) => (small ? '44px' : 'auto')};
  min-width: ${({ large, small }) => (large ? '136px' : small ? 'unset' : '121px')} !important;
  justify-content: ${({ alignRight }) => (alignRight ? 'flex-end' : 'flex-start')};
`

const SmallDetailBubble = styled(LoadingBubble)`
  height: 20px;
  width: 20px;
  border-radius: 100px;
`

function PoolDetailsLoadingSkeleton() {
  return (
    <LeftColumn>
      <RouteBubble />
      <Column gap="sm">
        <Row gap="8px">
          <IconBubble />
          <TokenNameBubble />
        </Row>
        <TVLBubble />
      </Column>
      {/* TODO Actual Chart skeleton */}
      <ChartSkeleton />
      <HR />
      <ChartHeaderBubble />
      {/* TODO(WEB-2735): When making table, have headers be shared */}
      <Table $isHorizontalScroll>
        <TableRow $borderBottom>
          <TableElement large>
            <Row>
              <ArrowDown size={16} />
              <Trans>Time</Trans>
            </Row>
          </TableElement>
          <TableElement>
            <Trans>Type</Trans>
          </TableElement>
          <TableElement alignRight>
            <Trans>USD</Trans>
          </TableElement>
          <TableElement alignRight>
            <DetailBubble />
          </TableElement>
          <TableElement alignRight>
            <DetailBubble />
          </TableElement>
          <TableElement alignRight>
            <Trans>Maker</Trans>
          </TableElement>
          <TableElement alignRight small>
            <Trans>Txn</Trans>
          </TableElement>
        </TableRow>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={`loading-table-row-${i}`}>
            <TableElement large>
              <DetailBubble />
            </TableElement>
            <TableElement>
              <DetailBubble />
            </TableElement>
            <TableElement alignRight>
              <DetailBubble />
            </TableElement>
            <TableElement alignRight>
              <DetailBubble />
            </TableElement>
            <TableElement alignRight>
              <DetailBubble />
            </TableElement>
            <TableElement alignRight>
              <DetailBubble />
            </TableElement>
            <TableElement alignRight small>
              <SmallDetailBubble />
            </TableElement>
          </TableRow>
        ))}
      </Table>
    </LeftColumn>
  )
}

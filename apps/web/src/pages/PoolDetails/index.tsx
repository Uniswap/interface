import { Trans } from '@lingui/macro'
import { ChartType, PriceChartType } from 'components/Charts/utils'
import Column from 'components/Column'
import ChartSection, {
  PDP_CHART_SELECTOR_OPTIONS,
  PoolsDetailsChartType,
} from 'components/Pools/PoolDetails/ChartSection'
import { PoolDetailsBreadcrumb, PoolDetailsHeader } from 'components/Pools/PoolDetails/PoolDetailsHeader'
import { PoolDetailsLink } from 'components/Pools/PoolDetails/PoolDetailsLink'
import { PoolDetailsStats } from 'components/Pools/PoolDetails/PoolDetailsStats'
import { PoolDetailsStatsButtons } from 'components/Pools/PoolDetails/PoolDetailsStatsButtons'
import { PoolDetailsTableTab } from 'components/Pools/PoolDetails/PoolDetailsTable'
import Row from 'components/Row'
import { AdvancedPriceChartToggle } from 'components/Tokens/TokenDetails/ChartTypeSelectors/AdvancedPriceChartToggle'
import ChartTypeSelector from 'components/Tokens/TokenDetails/ChartTypeSelectors/ChartTypeSelector'
import { getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { usePoolData } from 'graphql/thegraph/PoolData'
import NotFound from 'pages/NotFound'
import { useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { isAddress } from 'utils'

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

const ChartTypeSelectorContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const HR = styled.hr`
  border: 0.5px solid ${({ theme }) => theme.surface3};
  margin: 16px 0px;
  width: 100%;
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

const LinksContainer = styled(Column)`
  gap: 16px;
  width: 100%;
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

  const [chartType, setChartType] = useState<PoolsDetailsChartType>(ChartType.PRICE)
  const [priceChartType, setPriceChartType] = useState<PriceChartType>(PriceChartType.LINE)

  if (poolNotFound) return <NotFound />
  return (
    <PageWrapper>
      <LeftColumn>
        <Column gap="lg">
          <PoolDetailsBreadcrumb
            chainId={chainId}
            poolAddress={poolAddress}
            token0={token0}
            token1={token1}
            loading={loading}
          />
          <Row justify="space-between">
            <PoolDetailsHeader
              chainId={chainId}
              token0={token0}
              token1={token1}
              feeTier={poolData?.feeTier}
              toggleReversed={toggleReversed}
              loading={loading}
            />
            <ChartTypeSelectorContainer>
              {chartType === ChartType.PRICE && (
                <AdvancedPriceChartToggle currentChartType={priceChartType} onChartTypeChange={setPriceChartType} />
              )}
              <ChartTypeSelector
                options={PDP_CHART_SELECTOR_OPTIONS}
                currentChartType={chartType}
                onChartTypeChange={(c) => {
                  setChartType(c)
                  if (c === ChartType.PRICE) setPriceChartType(PriceChartType.LINE)
                }}
              />
            </ChartTypeSelectorContainer>
          </Row>
          <ChartSection
            token0={token0}
            token1={token1}
            chartType={chartType}
            priceChartType={priceChartType}
            feeTier={poolData?.feeTier}
            loading={loading}
          />
        </Column>
        <HR />
        <PoolDetailsTableTab poolAddress={poolAddress} token0={token0} token1={token1} />
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
        <TokenDetailsWrapper>
          <TokenDetailsHeader>
            <Trans>Links</Trans>
          </TokenDetailsHeader>
          <LinksContainer>
            <PoolDetailsLink address={poolAddress} chainId={chainId} tokens={[token0, token1]} loading={loading} />
            <PoolDetailsLink address={token0?.id} chainId={chainId} tokens={[token0]} loading={loading} />
            <PoolDetailsLink address={token1?.id} chainId={chainId} tokens={[token1]} loading={loading} />
          </LinksContainer>
        </TokenDetailsWrapper>
      </RightColumn>
    </PageWrapper>
  )
}

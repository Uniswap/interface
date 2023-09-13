import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { DeltaArrow, formatDelta } from 'components/Tokens/TokenDetails/Delta'
import { getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { PoolData, usePoolData } from 'graphql/thegraph/PoolData'
import NotFound from 'pages/NotFound'
import { ReactNode, useReducer } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme'
import { isAddress } from 'utils'
import { formatUSDPrice } from 'utils/formatNumbers'

import { PoolDetailsHeader } from './PoolDetailsHeader'

const PageWrapper = styled(Row)`
  padding: 48px 56px;
  width: 100%;
  align-items: flex-start;
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
      {poolData && <PoolDetailsStats poolData={poolData} />}
    </PageWrapper>
  )
}

const StatsWrapper = styled(Column)`
  gap: 24px;
  margin: 0 48px 0 auto;
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.surface2};
  // TODO: find a better solution for the width?
  width: 22vw;
`

function PoolDetailsStats({ poolData }: { poolData: PoolData }) {
  // TODO: header spacing and 24H formatting vs https://info.uniswap.org/#/polygon/pools/0x167384319b41f7094e62f7506409eb38079abff8
  // move formatter to statItem?
  // add graph
  // add color extraction for tokens
  const formattedTvl = formatUSDPrice(poolData.tvlUSD)
  const formatted24HVolume = formatUSDPrice(poolData.volumeUSD)
  const formatted24HFees = formatUSDPrice(poolData.volumeUSD * (poolData.feeTier / 1000000))
  return (
    <StatsWrapper>
      <ThemedText.DeprecatedLargeHeader>
        <Trans>Stats</Trans>
      </ThemedText.DeprecatedLargeHeader>
      <Column gap="sm">
        <ThemedText.BodySecondary>
          <Trans>Pool balances</Trans>
        </ThemedText.BodySecondary>
        {/* TODO Balances graph */}
      </Column>
      <StatItem title={<Trans>TVL</Trans>} value={formattedTvl} delta={poolData.tvlUSDChange} />
      <StatItem title={<Trans>24H volume</Trans>} value={formatted24HVolume} delta={poolData.volumeUSDChange} />
      <StatItem title={<Trans>24H fees</Trans>} value={formatted24HFees} />
    </StatsWrapper>
  )
}

function StatItem({ title, value, delta }: { title: ReactNode; value: string; delta?: number }) {
  return (
    <Column gap="sm">
      <ThemedText.BodySecondary>{title}</ThemedText.BodySecondary>
      <Row gap="4px" width="full" align="flex-end">
        <ThemedText.HeadlineLarge>{value}</ThemedText.HeadlineLarge>
        {!!delta && (
          <Row width="max-content" padding="4px 0px">
            <DeltaArrow delta={delta} />
            <ThemedText.BodySecondary>{formatDelta(delta)}</ThemedText.BodySecondary>
          </Row>
        )}
      </Row>
    </Column>
  )
}

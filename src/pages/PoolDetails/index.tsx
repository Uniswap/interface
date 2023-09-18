import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { DeltaArrow, formatDelta } from 'components/Tokens/TokenDetails/Delta'
import { getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { PoolData, usePoolData } from 'graphql/thegraph/PoolData'
import { useCurrency } from 'hooks/Tokens'
import NotFound from 'pages/NotFound'
import { ReactNode, useMemo, useReducer } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { ThemedText } from 'theme'
import { isAddress } from 'utils'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { useColor } from '../../hooks/useColor'
import { PoolDetailsHeader } from './PoolDetailsHeader'

const PageWrapper = styled(Row)`
  padding: 48px 56px;
  width: 100%;
  align-items: flex-start;
`

const HeaderText = styled(Text)`
  font-weight: 485;
  font-size: 24px;
  line-height: 36px;
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
      {poolData && <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainId} />}
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

const PoolBalanceTokenNames = styled(Text)`
  font-weight: 485;
  font-size: 18px;
  line-height: 24px;
`

interface Token {
  id: string
  symbol: string
}

interface PoolDetailsStatsProps {
  poolData: PoolData
  isReversed: boolean
  chainId?: number
}

const BalanceChartSide = styled.div<{ percent: number; $color: string; left: boolean }>`
  height: 8px;
  width: ${({ percent }) => percent * 100}%;
  background: ${({ $color }) => $color};
`

function PoolDetailsStats({ poolData, isReversed, chainId }: PoolDetailsStatsProps) {
  // TODO: vs https://info.uniswap.org/#/polygon/pools/0x167384319b41f7094e62f7506409eb38079abff8
  // style graph
  // fix color extraction for tokens
  const { formatNumber } = useFormatter()
  const currencies = [
    useCurrency(poolData?.token0?.id, chainId) ?? undefined,
    useCurrency(poolData?.token1?.id, chainId) ?? undefined,
  ]

  // We can't wrap this in a eseMemo hook because useColor is also a hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const color0 = useColor(currencies[0]?.wrapped)
  const color1 = useColor(currencies[1]?.wrapped)
  const [token0, token1] = useMemo(() => {
    const fullWidth = poolData?.tvlToken0 / poolData?.token0Price + poolData?.tvlToken1
    const token0FullData = {
      ...poolData?.token0,
      price: poolData?.token0Price,
      tvl: poolData?.tvlToken0,
      color: color0,
      percent: poolData?.tvlToken0 / poolData?.token0Price / fullWidth,
    }
    const token1FullData = {
      ...poolData?.token1,
      price: poolData?.token1Price,
      tvl: poolData?.tvlToken1,
      color: color1,
      percent: poolData?.tvlToken1 / fullWidth,
    }
    return isReversed ? [token1FullData, token0FullData] : [token0FullData, token1FullData]
  }, [color0, color1, isReversed, poolData])

  return (
    <StatsWrapper>
      <HeaderText>
        <Trans>Stats</Trans>
      </HeaderText>
      <Column gap="sm">
        <ThemedText.BodySecondary>
          <Trans>Pool balances</Trans>
        </ThemedText.BodySecondary>
        <Row justify="space-between">
          <PoolBalanceTokenNames>
            {formatNumber({
              input: token0.tvl,
              type: NumberType.TokenNonTx,
            })}
            &nbsp;
            {token0.symbol}
          </PoolBalanceTokenNames>
          <PoolBalanceTokenNames>
            {formatNumber({
              input: token1.tvl,
              type: NumberType.TokenNonTx,
            })}
            &nbsp;
            {token1.symbol}
          </PoolBalanceTokenNames>
        </Row>
        <Row>
          {token0.color && <BalanceChartSide percent={token0.percent} $color={token0.color} left={true} />}
          {token1.color && <BalanceChartSide percent={token1.percent} $color={token1.color} left={false} />}
        </Row>
      </Column>
      <StatItem title={<Trans>TVL</Trans>} value={poolData.tvlUSD} delta={poolData.tvlUSDChange} />
      <StatItem title={<Trans>24H volume</Trans>} value={poolData.volumeUSD} delta={poolData.volumeUSDChange} />
      <StatItem title={<Trans>24H fees</Trans>} value={poolData.volumeUSD * (poolData.feeTier / 1000000)} />
    </StatsWrapper>
  )
}

function StatItem({ title, value, delta }: { title: ReactNode; value: number; delta?: number }) {
  const { formatNumber } = useFormatter()

  return (
    <Column gap="sm">
      <ThemedText.BodySecondary>{title}</ThemedText.BodySecondary>
      <Row gap="4px" width="full" align="flex-end">
        <ThemedText.HeadlineLarge>
          {formatNumber({
            input: value,
            type: NumberType.FiatTokenStats,
          })}
        </ThemedText.HeadlineLarge>
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

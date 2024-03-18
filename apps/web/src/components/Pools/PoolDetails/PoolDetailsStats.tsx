import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { LoadingBubble } from 'components/Tokens/loading'
import { Token } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, getTokenDetailsURL, unwrapToken } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useScreenSize } from 'hooks/useScreenSize'
import { ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css, useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { PoolData } from 'graphql/data/pools/usePoolData'
import { DetailBubble } from './shared'

const HeaderText = styled(Text)`
  font-weight: 485;
  font-size: 24px;
  line-height: 36px;
  @media (max-width: ${BREAKPOINTS.lg}px) {
    width: 100%;
  }
`

const StatsWrapper = styled(Column)<{ loaded?: boolean }>`
  gap: 24px;
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.surface2};
  width: 100%;
  z-index: 1;
  margin-top: ${({ loaded }) => loaded && '-24px'};

  @media (max-width: ${BREAKPOINTS.lg}px) {
    flex-direction: row;
    background: transparent;
    flex-wrap: wrap;
    padding: 20px 0px;
    justify-content: space-between;
    margin-top: 0px;
  }
`

const StatItemColumn = styled(Column)`
  gap: 8px;
  flex: 1;
  min-width: 180px;

  @media (max-width: ${BREAKPOINTS.sm}px) {
    min-width: 150px;
  }
`

const PoolBalanceSymbols = styled(Row)`
  justify-content: space-between;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    flex-direction: column;
  }
`

const PoolBalanceTokenNamesContainer = styled(Row)`
  font-weight: 485;
  font-size: 16px;
  line-height: 24px;
  width: max-content;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    font-size: 20px;
    line-height: 28px;
    width: 100%;
  }
`

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.neutral1};
  ${ClickableStyle}
`

const leftBarChartStyles = css`
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  border-right: 1px solid ${({ theme }) => theme.surface2};
`

const rightBarChartStyles = css`
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border-left: 1px solid ${({ theme }) => theme.surface2};
`

const BalanceChartSide = styled.div<{ percent: number; $color: string; isLeft: boolean }>`
  height: 8px;
  width: ${({ percent }) => percent * 100}%;
  background: ${({ $color }) => $color};
  ${({ isLeft }) => (isLeft ? leftBarChartStyles : rightBarChartStyles)}
`

const StatSectionBubble = styled(LoadingBubble)`
  width: 180px;
  height: 40px;
`

const StatHeaderBubble = styled(LoadingBubble)`
  width: 116px;
  height: 24px;
  border-radius: 8px;
`

type TokenFullData = Token & {
  price: number
  tvl: number
  percent: number
  currency?: Currency
}

const PoolBalanceTokenNames = ({ token, chainId }: { token: TokenFullData; chainId?: number }) => {
  const isScreenSize = useScreenSize()
  const screenIsNotLarge = isScreenSize['lg']
  const { formatNumber } = useFormatter()
  const unwrappedToken = chainId ? unwrapToken(chainId, token) : token
  const isNative = unwrappedToken?.address === NATIVE_CHAIN_ID
  const currency = isNative && chainId ? nativeOnChain(chainId) : token.currency
  return (
    <PoolBalanceTokenNamesContainer>
      {!screenIsNotLarge && <CurrencyLogo currency={currency} size="20px" style={{ marginRight: '8px' }} />}
      {formatNumber({
        input: token.tvl,
        type: NumberType.TokenQuantityStats,
      })}
      &nbsp;
      <StyledLink
        to={getTokenDetailsURL({
          address: unwrappedToken.address,
          chain: chainIdToBackendName(chainId),
        })}
      >
        {screenIsNotLarge && (
          <CurrencyLogo currency={currency} size="16px" style={{ marginRight: '4px', marginLeft: '4px' }} />
        )}
        {unwrappedToken.symbol}
      </StyledLink>
    </PoolBalanceTokenNamesContainer>
  )
}

interface PoolDetailsStatsProps {
  poolData?: PoolData
  isReversed?: boolean
  chainId?: number
  loading?: boolean
}

export function PoolDetailsStats({ poolData, isReversed, chainId, loading }: PoolDetailsStatsProps) {
  const isScreenSize = useScreenSize()
  const screenIsNotLarge = isScreenSize['lg']
  const theme = useTheme()

  const currency0 = useCurrency(poolData?.token0?.address, chainId)
  const currency1 = useCurrency(poolData?.token1?.address, chainId)

  const [token0, token1] = useMemo(() => {
    if (poolData && poolData.tvlToken0 && poolData.token0Price && poolData.tvlToken1 && poolData.token1Price) {
      const fullWidth = poolData?.tvlToken0 * poolData?.token0Price + poolData?.tvlToken1 * poolData?.token1Price
      const token0FullData: TokenFullData = {
        ...poolData?.token0,
        price: poolData?.token0Price,
        tvl: poolData?.tvlToken0,
        percent: (poolData?.tvlToken0 * poolData?.token0Price) / fullWidth,
        currency: currency0,
      }
      const token1FullData: TokenFullData = {
        ...poolData?.token1,
        price: poolData?.token1Price,
        tvl: poolData?.tvlToken1,
        percent: (poolData?.tvlToken1 * poolData?.token1Price) / fullWidth,
        currency: currency1,
      }
      return isReversed ? [token1FullData, token0FullData] : [token0FullData, token1FullData]
    } else {
      return [undefined, undefined]
    }
  }, [currency0, currency1, isReversed, poolData])

  if (loading || !token0 || !token1 || !poolData) {
    return (
      <StatsWrapper>
        <HeaderText>
          <StatHeaderBubble />
        </HeaderText>
        {Array.from({ length: 4 }).map((_, i) => (
          <Column gap="md" key={`loading-info-row-${i}`}>
            <DetailBubble />
            <StatSectionBubble />
          </Column>
        ))}
      </StatsWrapper>
    )
  }

  return (
    <StatsWrapper loaded>
      <HeaderText>
        <Trans>Stats</Trans>
      </HeaderText>
      <StatItemColumn>
        <ThemedText.BodySecondary>
          <Trans>Pool balances</Trans>
        </ThemedText.BodySecondary>
        <PoolBalanceSymbols>
          <PoolBalanceTokenNames token={token0} chainId={chainId} />
          <PoolBalanceTokenNames token={token1} chainId={chainId} />
        </PoolBalanceSymbols>
        {screenIsNotLarge && (
          <Row data-testid="pool-balance-chart">
            <BalanceChartSide percent={token0.percent} $color={theme.token0} isLeft={true} />
            <BalanceChartSide percent={token1.percent} $color={theme.token1} isLeft={false} />
          </Row>
        )}
      </StatItemColumn>
      {poolData?.tvlUSD && (
        <StatItem title={<Trans>TVL</Trans>} value={poolData.tvlUSD} delta={poolData.tvlUSDChange} />
      )}
      {poolData?.volumeUSD24H !== undefined && (
        <StatItem title={<Trans>24H volume</Trans>} value={poolData.volumeUSD24H} delta={poolData.volumeUSD24HChange} />
      )}
      {poolData?.volumeUSD24H !== undefined && poolData?.feeTier !== undefined && (
        <StatItem title={<Trans>24H fees</Trans>} value={poolData.volumeUSD24H * (poolData.feeTier / 1000000)} />
      )}
    </StatsWrapper>
  )
}

const StatsTextContainer = styled(Row)`
  gap: 4px;
  width: 100%;
  align-items: flex-end;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    flex-direction: column;
    gap: 0px;
    align-items: flex-start;
  }
`

const StatItemText = styled(Text)`
  color: ${({ theme }) => theme.neutral1};
  font-size: 36px;
  font-weight: 485;
  line-height: 44px;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    font-size: 20px;
    line-height: 28px;
  }
`

function StatItem({ title, value, delta }: { title: ReactNode; value: number; delta?: number }) {
  const { formatNumber, formatDelta } = useFormatter()

  return (
    <StatItemColumn>
      <ThemedText.BodySecondary>{title}</ThemedText.BodySecondary>
      <StatsTextContainer>
        <StatItemText>
          {formatNumber({
            input: value,
            type: NumberType.FiatTokenStats,
          })}
        </StatItemText>
        {!!delta && (
          <Row width="max-content" padding="4px 0px">
            <DeltaArrow delta={delta} />
            <ThemedText.BodySecondary>{formatDelta(delta)}</ThemedText.BodySecondary>
          </Row>
        )}
      </StatsTextContainer>
    </StatItemColumn>
  )
}

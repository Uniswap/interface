import { PoolData } from 'appGraphql/data/pools/usePoolData'
import { getTokenDetailsURL, unwrapToken } from 'appGraphql/data/util'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DetailBubble } from 'components/Pools/PoolDetails/shared'
import { LoadingBubble } from 'components/Tokens/loading'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import styled, { css, useTheme } from 'lib/styled-components'
import { ReactNode, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Link } from 'react-router'
import { Text as RebassText } from 'rebass'
import { ThemedText } from 'theme/components'
import { ClickableStyle } from 'theme/components/styles'
import { Flex, Text, useMedia } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const HeaderText = styled(RebassText)`
  font-weight: 485;
  font-size: 24px;
  line-height: 36px;
  @media (max-width: ${breakpoints.xl}px) {
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

  @media (max-width: ${breakpoints.xl}px) {
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

  @media (max-width: ${breakpoints.md}px) {
    min-width: 150px;
  }
`

const PoolBalanceSymbols = styled(Row)`
  justify-content: space-between;

  @media (max-width: ${breakpoints.xl}px) {
    flex-direction: column;
  }
`

const PoolBalanceTokenNamesContainer = styled(Row)`
  font-weight: 485;
  font-size: 16px;
  line-height: 24px;
  width: max-content;

  @media (max-width: ${breakpoints.xl}px) {
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

type TokenFullData = GraphQLApi.Token & {
  price: number
  tvl: number
  percent: number
  currency?: Currency
}

const PoolBalanceTokenNames = ({ token, chainId }: { token: TokenFullData; chainId?: UniverseChainId }) => {
  const media = useMedia()
  const isLargeScreen = !media.xl
  const { formatNumberOrString } = useLocalizationContext()
  const unwrappedToken = chainId ? unwrapToken(chainId, token) : token
  const isNative = unwrappedToken.address === NATIVE_CHAIN_ID
  const currency = isNative && chainId ? nativeOnChain(chainId) : token.currency
  const { defaultChainId } = useEnabledChains()

  return (
    <PoolBalanceTokenNamesContainer>
      <Flex row alignItems="center" gap="$spacing4">
        {!isLargeScreen && <CurrencyLogo currency={currency} size={20} />}
        <Text variant="heading3" fontSize={20}>
          {formatNumberOrString({
            value: token.tvl,
            type: NumberType.TokenQuantityStats,
          })}
        </Text>
        <StyledLink
          to={getTokenDetailsURL({
            address: unwrappedToken.address,
            chain: toGraphQLChain(chainId ?? defaultChainId),
          })}
        >
          {unwrappedToken.symbol}
        </StyledLink>
      </Flex>
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
  const media = useMedia()
  const isLargeScreen = !media.xl
  const theme = useTheme()

  const currency0 = useCurrency({
    address: poolData?.token0.address,
    chainId,
  })
  const currency1 = useCurrency({
    address: poolData?.token1.address,
    chainId,
  })

  const [token0, token1]: [TokenFullData | undefined, TokenFullData | undefined] = useMemo(() => {
    if (poolData && poolData.tvlToken0 && poolData.token0Price && poolData.tvlToken1 && poolData.token1Price) {
      const fullWidth = poolData.tvlToken0 * poolData.token0Price + poolData.tvlToken1 * poolData.token1Price
      const token0FullData: TokenFullData = {
        ...poolData.token0,
        price: poolData.token0Price,
        tvl: poolData.tvlToken0,
        percent: (poolData.tvlToken0 * poolData.token0Price) / fullWidth,
        currency: currency0,
      }
      const token1FullData: TokenFullData = {
        ...poolData.token1,
        price: poolData.token1Price,
        tvl: poolData.tvlToken1,
        percent: (poolData.tvlToken1 * poolData.token1Price) / fullWidth,
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
        <Trans i18nKey="common.stats" />
      </HeaderText>
      <StatItemColumn>
        <ThemedText.BodySecondary>
          <Trans i18nKey="pool.balances" />
        </ThemedText.BodySecondary>
        <PoolBalanceSymbols>
          <PoolBalanceTokenNames token={token0} chainId={chainId} />
          <PoolBalanceTokenNames token={token1} chainId={chainId} />
        </PoolBalanceSymbols>
        {isLargeScreen && (
          <Row data-testid="pool-balance-chart">
            <BalanceChartSide percent={token0.percent} $color={theme.token0} isLeft={true} />
            <BalanceChartSide percent={token1.percent} $color={theme.token1} isLeft={false} />
          </Row>
        )}
      </StatItemColumn>
      {poolData.tvlUSD && (
        <StatItem
          title={<Trans i18nKey="common.totalValueLocked" />}
          value={poolData.tvlUSD}
          delta={poolData.tvlUSDChange}
        />
      )}
      {poolData.volumeUSD24H !== undefined && (
        <StatItem
          title={<Trans i18nKey="stats.24volume" />}
          value={poolData.volumeUSD24H}
          delta={poolData.volumeUSD24HChange}
        />
      )}
      {poolData.volumeUSD24H !== undefined && poolData.feeTier !== undefined && (
        <StatItem
          title={<Trans i18nKey="stats.24fees" />}
          value={poolData.volumeUSD24H * (poolData.feeTier.feeAmount / 1000000)}
        />
      )}
    </StatsWrapper>
  )
}

const StatsTextContainer = styled(Row)`
  gap: 4px;
  width: 100%;
  align-items: flex-end;

  @media (max-width: ${breakpoints.xl}px) {
    flex-direction: column;
    gap: 0px;
    align-items: flex-start;
  }
`

const StatItemText = styled(RebassText)`
  color: ${({ theme }) => theme.neutral1};
  font-size: 36px;
  font-weight: 485;
  line-height: 44px;

  @media (max-width: ${breakpoints.xl}px) {
    font-size: 20px;
    line-height: 28px;
  }
`

function StatItem({ title, value, delta }: { title: ReactNode; value: number; delta?: number }) {
  const { formatPercent, formatNumberOrString } = useLocalizationContext()

  return (
    <StatItemColumn>
      <ThemedText.BodySecondary>{title}</ThemedText.BodySecondary>
      <StatsTextContainer>
        <StatItemText>
          {formatNumberOrString({
            value,
            type: NumberType.FiatTokenStats,
          })}
        </StatItemText>
        {!!delta && (
          <Flex row width="max-content" py="$spacing4" $lg={{ py: 0 }}>
            <DeltaArrow delta={delta} formattedDelta={formatPercent(Math.abs(delta))} />
            <ThemedText.BodySecondary>{formatPercent(Math.abs(delta))}</ThemedText.BodySecondary>
          </Flex>
        )}
      </StatsTextContainer>
    </StatItemColumn>
  )
}

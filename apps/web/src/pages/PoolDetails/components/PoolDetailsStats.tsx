import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, styled, Text, useMedia, View } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { getTokenDetailsURL, unwrapToken } from '~/appGraphql/data/util'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import CurrencyLogo from '~/components/Logo/CurrencyLogo'
import { LoadingBubble } from '~/components/Tokens/loading'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCurrency } from '~/hooks/Tokens'
import { DetailBubble } from '~/pages/PoolDetails/components/shared'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const HeaderText = styled(Text, {
  fontWeight: '$book',
  fontSize: 24,
  lineHeight: 36,
  $xl: {
    width: '100%',
  },
})

const StatsWrapper = styled(Flex, {
  gap: '$gap24',
  p: '$padding20',
  borderRadius: '$rounded20',
  backgroundColor: '$surface2',
  width: '100%',
  zIndex: 1,
  $xl: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    flexWrap: 'wrap',
    px: '$none',
    py: '$padding20',
    justifyContent: 'space-between',
    mt: 0,
  },
  variants: {
    loaded: {
      true: {
        mt: -24,
        $xl: {
          mt: 0,
        },
      },
    },
  },
})

const StatItemColumn = styled(Flex, {
  gap: '$gap8',
  flex: 1,
  flexBasis: 'auto',
  minWidth: 180,
  $md: {
    minWidth: 150,
  },
  $xl: {
    flexBasis: 0,
  },
})

const PoolBalanceSymbols = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  $xl: {
    flexDirection: 'column',
  },
})

const PoolBalanceTokenNamesContainer = styled(Flex, {
  row: true,
  width: 'max-content',
  $xl: {
    width: '100%',
  },
})

const PoolBalanceText = styled(Text, {
  fontWeight: '$book',
  fontSize: 16,
  lineHeight: 24,
  $xl: {
    fontSize: 20,
    lineHeight: 28,
  },
})

const StyledLink = styled(Link, {
  display: 'flex',
  alignItems: 'center',
  color: '$neutral1',
  ...ClickableTamaguiStyle,
})

const BalanceChartSide = ({ percent, color, isLeft }: { percent: number; color: string; isLeft: boolean }) => (
  <View
    height={8}
    width={`${percent * 100}%`}
    backgroundColor={color as any}
    borderTopLeftRadius={isLeft ? 5 : 0}
    borderBottomLeftRadius={isLeft ? 5 : 0}
    borderTopRightRadius={isLeft ? 0 : 5}
    borderBottomRightRadius={isLeft ? 0 : 5}
    borderRightWidth={isLeft ? 1 : 0}
    borderLeftWidth={isLeft ? 0 : 1}
    borderRightColor="$surface2"
    borderLeftColor="$surface2"
    borderTopWidth={0}
    borderBottomWidth={0}
    borderStyle="solid"
  />
)

const StatSectionBubble = () => <LoadingBubble width={180} height={40} />

const StatHeaderBubble = () => <LoadingBubble width={116} height={24} skeletonProps={{ borderRadius: '$rounded8' }} />

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
        <PoolBalanceText>
          {formatNumberOrString({
            value: token.tvl,
            type: NumberType.TokenQuantityStats,
          })}
        </PoolBalanceText>
        <StyledLink
          to={getTokenDetailsURL({
            address: unwrappedToken.address,
            chain: toGraphQLChain(chainId ?? defaultChainId),
          })}
        >
          <PoolBalanceText>{unwrappedToken.symbol}</PoolBalanceText>
        </StyledLink>
      </Flex>
    </PoolBalanceTokenNamesContainer>
  )
}

interface PoolDetailsStatsProps {
  poolData?: PoolData
  tokenAColor: string
  tokenBColor: string
  isReversed?: boolean
  chainId?: number
  loading?: boolean
}

export function PoolDetailsStats({
  poolData,
  tokenAColor,
  tokenBColor,
  isReversed,
  chainId,
  loading,
}: PoolDetailsStatsProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const isLargeScreen = !media.xl

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
          <Flex gap="$gap16" key={`loading-info-row-${i}`}>
            <DetailBubble />
            <StatSectionBubble />
          </Flex>
        ))}
      </StatsWrapper>
    )
  }

  return (
    <StatsWrapper loaded>
      <HeaderText>{t('common.stats')}</HeaderText>
      <StatItemColumn>
        <Text variant="body1" color="$neutral2">
          {t('pool.balances')}
        </Text>
        <PoolBalanceSymbols>
          <PoolBalanceTokenNames token={token0} chainId={chainId} />
          <PoolBalanceTokenNames token={token1} chainId={chainId} />
        </PoolBalanceSymbols>
        {isLargeScreen && (
          <Flex row data-testid="pool-balance-chart">
            <BalanceChartSide percent={token0.percent} color={tokenAColor} isLeft={true} />
            <BalanceChartSide percent={token1.percent} color={tokenBColor} isLeft={false} />
          </Flex>
        )}
      </StatItemColumn>
      {poolData.tvlUSD && (
        <StatItem title={t('common.totalValueLocked')} value={poolData.tvlUSD} delta={poolData.tvlUSDChange} />
      )}
      {poolData.volumeUSD24H !== undefined && (
        <StatItem title={t('stats.24volume')} value={poolData.volumeUSD24H} delta={poolData.volumeUSD24HChange} />
      )}
      {poolData.volumeUSD24H !== undefined && poolData.feeTier !== undefined && (
        <StatItem title={t('stats.24fees')} value={poolData.volumeUSD24H * (poolData.feeTier.feeAmount / 1000000)} />
      )}
    </StatsWrapper>
  )
}

const StatsTextContainer = styled(Flex, {
  row: true,
  gap: 4,
  width: '100%',
  alignItems: 'flex-end',
  $xl: {
    flexDirection: 'column',
    gap: 0,
    alignItems: 'flex-start',
  },
})

const StatItemText = styled(Text, {
  color: '$neutral1',
  fontSize: 36,
  fontWeight: '485',
  lineHeight: 44,
  $xl: {
    fontSize: 20,
    lineHeight: 28,
  },
})

function StatItem({ title, value, delta }: { title: ReactNode; value: number; delta?: number }) {
  const { formatPercent, formatNumberOrString } = useLocalizationContext()

  return (
    <StatItemColumn>
      <Text variant="body1" color="$neutral2">
        {title}
      </Text>
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
            <Text variant="body1" color="$neutral2">
              {formatPercent(Math.abs(delta))}
            </Text>
          </Flex>
        )}
      </StatsTextContainer>
    </StatItemColumn>
  )
}

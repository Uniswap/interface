import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Flex, type FlexCompatProps, Text, type TextCompatProps, View } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef, ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { type ParsedToken, isNativeParsedToken, v2UnwrapToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { PositionRewardApr } from 'uniswap/src/features/positions/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { LoadingBubble } from '~/components/Tokens/loading'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import type { PoolData } from '~/data/pools/poolData'
import { get24hLpFeesUsd } from '~/data/pools/poolStats'
import { getTokenDetailsURL } from '~/data/util'
import { RewardAprBadge } from '~/features/Liquidity/LPIncentives/RewardAprBadge'
import { useCurrency } from '~/hooks/Tokens'
import { DetailBubble } from '~/pages/PoolDetails/components/shared'

const HeaderText = forwardRef<HTMLElement, TextCompatProps>(function HeaderText({ $xl: xl, ...props }, ref) {
  // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
  return <Text ref={ref} fontWeight="$book" fontSize={24} lineHeight={36} $xl={{ width: '100%', ...xl }} {...props} />
})

const StatsWrapper = forwardRef<HTMLDivElement, FlexCompatProps>(function StatsWrapper({ $xl: xl, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      gap="$gap24"
      p="$padding20"
      borderRadius="$rounded20"
      backgroundColor="$surface2"
      width="100%"
      zIndex={1}
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $xl={{
        flexDirection: 'row',
        backgroundColor: 'transparent',
        flexWrap: 'wrap',
        px: '$none',
        py: '$padding20',
        justifyContent: 'space-between',
        mt: 0,
        ...xl,
      }}
      {...props}
    />
  )
})

const StatItemColumn = forwardRef<HTMLDivElement, FlexCompatProps>(function StatItemColumn(
  { $md: md, $xl: xl, ...props },
  ref,
) {
  return (
    <Flex
      ref={ref}
      gap="$gap8"
      flex={1}
      flexBasis="auto"
      minWidth={180}
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $md={{ minWidth: 150, ...md }}
      $xl={{ flexBasis: 0, ...xl }}
      {...props}
    />
  )
})

const PoolBalanceSymbols = forwardRef<HTMLDivElement, FlexCompatProps>(function PoolBalanceSymbols(
  { $xl: xl, ...props },
  ref,
) {
  // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
  return <Flex ref={ref} row justifyContent="space-between" $xl={{ flexDirection: 'column', ...xl }} {...props} />
})

const PoolBalanceTokenNamesContainer = forwardRef<HTMLDivElement, FlexCompatProps>(
  function PoolBalanceTokenNamesContainer({ $xl: xl, ...props }, ref) {
    // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
    return <Flex ref={ref} row width="max-content" $xl={{ width: '100%', ...xl }} {...props} />
  },
)

const PoolBalanceText = forwardRef<HTMLElement, TextCompatProps>(function PoolBalanceText({ $xl: xl, ...props }, ref) {
  return (
    <Text
      ref={ref}
      fontWeight="$book"
      fontSize={16}
      lineHeight={24}
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $xl={{ fontSize: 20, lineHeight: 28, ...xl }}
      {...props}
    />
  )
})

// `transition-opacity`, not `all`: `all` animates theme tokens and flashes on a light/dark toggle.
const StyledLink = styled(Link, {
  platform: 'web',
  base: 'flex items-center cursor-pointer no-underline transition-opacity duration-100 hover:opacity-80 active:opacity-60',
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

type TokenFullData = ParsedToken & {
  price: number
  tvl: number
  percent: number
  currency?: Currency
}

const PoolBalanceTokenNames = ({ token, chainId }: { token: TokenFullData; chainId?: UniverseChainId }) => {
  const media = useMedia()
  const isLargeScreen = !media.xl
  const { formatNumberOrString } = useLocalizationContext()
  const unwrappedToken = chainId ? v2UnwrapToken(chainId, token) : token
  const isNative = isNativeParsedToken(unwrappedToken)
  const currency = isNative && chainId ? nativeOnChain(chainId) : token.currency
  const { defaultChainId } = useEnabledChains()
  const currencyInfo = useCurrencyInfo(currencyId(currency))

  return (
    <PoolBalanceTokenNamesContainer>
      <Flex row alignItems="center" gap="$spacing4">
        {!isLargeScreen && <CurrencyLogo currencyInfo={currencyInfo} size={20} />}
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
  /** Served fee APR in percent units (`PoolSummary.apr`). */
  poolApr?: number
  /** The pool's live per-token boosts, as served. Empty = no reward breakdown. */
  rewards?: PositionRewardApr[]
  /** Served fee + reward APR (`PoolSummary.total_apr`). */
  totalApr?: number
}

export function PoolDetailsStats({
  poolData,
  tokenAColor,
  tokenBColor,
  isReversed,
  chainId,
  loading,
  poolApr,
  rewards,
  totalApr,
}: PoolDetailsStatsProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const isLargeScreen = !media.xl

  // Absent address = native on the parsed shape; the NATIVE_CHAIN_ID sentinel resolves the native
  // currency, while an undefined address would skip the lookup entirely.
  const currency0 = useCurrency({
    address: poolData ? (poolData.token0.address ?? NATIVE_CHAIN_ID) : undefined,
    chainId,
  })
  const currency1 = useCurrency({
    address: poolData ? (poolData.token1.address ?? NATIVE_CHAIN_ID) : undefined,
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

  const fees24h = get24hLpFeesUsd(poolData)

  return (
    <StatsWrapper>
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
      {poolApr !== undefined && <AprStatItem poolApr={poolApr} rewards={rewards} totalApr={totalApr} />}
      {poolData.tvlUSD && (
        <StatItem title={t('common.totalValueLocked')} value={poolData.tvlUSD} delta={poolData.tvlUSDChange} />
      )}
      {poolData.volumeUSD24H !== undefined && (
        <StatItem title={t('stats.24volume')} value={poolData.volumeUSD24H} delta={poolData.volumeUSD24HChange} />
      )}
      {fees24h !== undefined && <StatItem title={t('stats.24fees')} value={fees24h} />}
    </StatsWrapper>
  )
}

const StatsTextContainer = forwardRef<HTMLDivElement, FlexCompatProps>(function StatsTextContainer(
  { $xl: xl, ...props },
  ref,
) {
  return (
    <Flex
      ref={ref}
      row
      gap={4}
      width="100%"
      alignItems="flex-end"
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $xl={{ flexDirection: 'column', gap: 0, alignItems: 'flex-start', ...xl }}
      {...props}
    />
  )
})

const StatItemText = forwardRef<HTMLElement, TextCompatProps>(function StatItemText({ $xl: xl, ...props }, ref) {
  return (
    <Text
      ref={ref}
      color="$neutral1"
      fontSize={36}
      fontWeight="485"
      lineHeight={44}
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $xl={{ fontSize: 20, lineHeight: 28, ...xl }}
      {...props}
    />
  )
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
            // 0 here is served data, not missing (unknown stats never render) — avoid FiatTokenStats' '-' placeholder
            type: value === 0 ? NumberType.FiatTokenPrice : NumberType.FiatTokenStats,
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

function AprStatItem({
  poolApr,
  rewards = [],
  totalApr,
}: {
  poolApr: number
  rewards?: PositionRewardApr[]
  totalApr?: number
}) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  // No breakdown without a boost to break out — and no boost the server hasn't named a token for,
  // which would leave the reward row a label beside nothing while the total above still counts it.
  const showAprBreakdown = rewards.length > 0
  // `total_apr` already sums the fee APR with every reward boost, and the proto only leaves it unset
  // when neither side is known — so a pool with a served `apr` always has one, boosted or not. No
  // client-side re-add, and no fee-APR fallback that would silently drop a live boost.
  const displayTotalApr = formatPercent(totalApr, 2)

  return (
    <StatItemColumn>
      <Text variant="body1" color="$neutral2">
        {t('pool.totalAPR')}
      </Text>
      <StatsTextContainer>
        <StatItemText>{displayTotalApr}</StatItemText>
      </StatsTextContainer>
      {showAprBreakdown && (
        <Flex mt="$spacing8" gap="$spacing6">
          <Flex row justifyContent="space-between" alignItems="center" gap="$gap8">
            <Text variant="body3" color="$neutral2">
              {t('pool.apr.base')}
            </Text>
            <Text variant="body3" color="$neutral1">
              {formatPercent(poolApr)}
            </Text>
          </Flex>
          <Flex row justifyContent="space-between" alignItems="center" gap="$gap8">
            <Text variant="body3" color="$neutral2">
              {t('pool.apr.reward')}
            </Text>
            <RewardAprBadge rewards={rewards} hideBackground label="symbol" />
          </Flex>
        </Flex>
      )}
    </StatItemColumn>
  )
}

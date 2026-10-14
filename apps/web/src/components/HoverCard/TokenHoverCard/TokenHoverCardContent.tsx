import { iconSizes, Flex, Text } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import {
  HoverCardBody,
  HoverCardChart,
  HoverCardChartSkeleton,
  HoverCardStatsRow,
  isHoverCardNoData,
} from '~/components/HoverCard/HoverCardContent'

export interface TokenHoverCardContentProps {
  currencyInfo: CurrencyInfo
  isMultichainAsset?: boolean
  price?: number | null
  pricePercentChange?: number | null
  priceAbsoluteChange?: number | null
  priceData?: PriceChartData[]
  chartLoading?: boolean
  volume24hUsd?: number
  tvlUsd?: number
  statsLoading?: boolean
  isCopied?: boolean
  onCopy?: () => void
  onExpand?: () => void
  maxWidth?: number
}

const STATS_LOADING_PLACEHOLDER = '$000.0K 24H vol · $0.0M TVL'

/** Body while the deferred CurrencyInfo fetch is in flight, or the no-data treatment once it settles empty. */
export function TokenHoverCardPlaceholder({
  unavailable,
  showStats = false,
  maxWidth,
}: {
  unavailable: boolean
  showStats?: boolean
  maxWidth?: number
}): JSX.Element {
  return (
    <HoverCardBody
      identity={
        unavailable ? undefined : <Text variant="body2" color="$neutral2" loading loadingPlaceholderText="TOKEN" />
      }
      isNoData={unavailable}
      maxWidth={maxWidth}
    >
      <PriceAndChangeRow loading formattedPrice="" hasChange={false} />
      <HoverCardChartSkeleton />
      {showStats && <HoverCardStatsRow loading loadingPlaceholderText={STATS_LOADING_PLACEHOLDER} stats={[]} />}
    </HoverCardBody>
  )
}

function PriceAndChangeRow({
  loading,
  formattedPrice,
  hasChange,
  pricePercentChange,
  priceAbsoluteChange,
}: {
  loading: boolean
  formattedPrice: string
  hasChange: boolean
  pricePercentChange?: number | null
  priceAbsoluteChange?: number | null
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing4">
      <Text variant="heading3" color="$neutral1" loading={loading} loadingPlaceholderText="$0,000.00">
        {formattedPrice}
      </Text>
      {loading ? (
        <Text variant="body3" color="$neutral2" loading loadingPlaceholderText="+0.00% today" />
      ) : hasChange ? (
        <Flex row gap="$spacing4" alignItems="center">
          <RelativeChange
            change={pricePercentChange ?? undefined}
            absoluteChange={priceAbsoluteChange ?? undefined}
            arrowSize="$icon.12"
            variant="body3"
          />
          <Text variant="body3" color="$neutral2">
            {t('common.today').toLocaleLowerCase()}
          </Text>
        </Flex>
      ) : (
        <Text variant="body3" color="$neutral2">
          -
        </Text>
      )}
    </Flex>
  )
}

function TokenHoverCardContentInner({
  currencyInfo,
  isMultichainAsset,
  price,
  pricePercentChange,
  priceAbsoluteChange,
  priceData,
  chartLoading = false,
  volume24hUsd,
  tvlUsd,
  statsLoading = false,
  isCopied = false,
  onCopy,
  onExpand,
  maxWidth,
}: TokenHoverCardContentProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()

  const formattedPrice = formatNumberOrString({
    value: price ?? undefined,
    type: NumberType.FiatTokenPrice,
  })

  const hasPrice = price != null
  const hasChange = pricePercentChange != null || priceAbsoluteChange != null
  const change = pricePercentChange ?? priceAbsoluteChange

  const volumeStat =
    volume24hUsd !== undefined
      ? t('token.hoverCard.volume24h', { amount: convertFiatAmountFormatted(volume24hUsd, NumberType.FiatTokenStats) })
      : undefined
  const tvlStat =
    tvlUsd !== undefined
      ? t('token.hoverCard.tvl', { amount: convertFiatAmountFormatted(tvlUsd, NumberType.FiatTokenStats) })
      : undefined
  // Volume and TVL come from a separate query, so they can stand alone when the price series is empty.
  const hasStats = volumeStat !== undefined || tvlStat !== undefined
  const isNoData =
    !hasStats && isHoverCardNoData({ loading: chartLoading || statsLoading, headline: price, change, data: priceData })

  return (
    <HoverCardBody
      identity={
        <>
          <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} hideNetworkLogo={isMultichainAsset} />
          <Text variant="body2" color="$neutral2" numberOfLines={1}>
            {currencyInfo.currency.symbol}
          </Text>
        </>
      }
      isCopied={isCopied}
      onCopy={onCopy}
      onExpand={onExpand}
      isNoData={isNoData}
      maxWidth={maxWidth}
    >
      {(chartLoading || hasPrice || hasChange) && (
        <PriceAndChangeRow
          loading={chartLoading}
          formattedPrice={formattedPrice}
          hasChange={hasChange}
          pricePercentChange={pricePercentChange}
          priceAbsoluteChange={priceAbsoluteChange}
        />
      )}
      <HoverCardChart loading={chartLoading} data={priceData} change={change} />
      <HoverCardStatsRow
        loading={statsLoading}
        loadingPlaceholderText={STATS_LOADING_PLACEHOLDER}
        stats={[volumeStat, tvlStat]}
      />
    </HoverCardBody>
  )
}

export const TokenHoverCardContent = memo(TokenHoverCardContentInner)

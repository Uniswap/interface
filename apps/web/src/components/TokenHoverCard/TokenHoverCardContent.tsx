import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatableCopyIcon, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { ArrowsExpand } from 'ui/src/components/icons/ArrowsExpand'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ChartUnavailableOverlay } from '~/components/Charts/ChartUnavailableOverlay'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChartBody, PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'

const CHART_HEIGHT = 104
export const CHART_WIDTH = 240

/** Width the hover card content should take, clamped to `CHART_WIDTH` and the available popover space. */
export function getTokenHoverCardContentWidth(maxWidth?: number): number {
  return maxWidth !== undefined ? Math.min(CHART_WIDTH, Math.max(0, Math.floor(maxWidth))) : CHART_WIDTH
}

export interface TokenHoverCardContentProps {
  currencyInfo: CurrencyInfo
  isMultichainAsset?: boolean
  price?: number | null
  pricePercentChange?: number | null
  priceAbsoluteChange?: number | null
  priceData?: PriceChartData[]
  chartLoading?: boolean
  isCopied?: boolean
  onCopy?: () => void
  onExpand?: () => void
  maxWidth?: number
}

function NoDataState(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      alignItems="center"
      gap="$spacing8"
      p="$spacing16"
      borderRadius="$rounded12"
      backgroundColor="$surface2"
      width="100%"
    >
      <AlertTriangle size="$icon.24" color="$neutral3" />
      <Text variant="body2" color="$neutral3" textAlign="center">
        {t('token.data.unavailable')}
      </Text>
    </Flex>
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

function HoverCardChart({
  loading,
  hasChartData,
  priceData,
  lineColor,
}: {
  loading: boolean
  hasChartData: boolean
  priceData?: PriceChartData[]
  lineColor: string
}): JSX.Element {
  if (loading) {
    return (
      <ChartSkeleton
        type={ChartType.PRICE}
        height={CHART_HEIGHT}
        hideYAxis
        hideXAxis
        hidePriceIndicators
        chartTransform="translate(5, -70)"
      />
    )
  }

  if (hasChartData) {
    return (
      <PriceChartBody
        data={priceData ?? []}
        height={CHART_HEIGHT}
        type={PriceChartType.LINE}
        stale={false}
        hideYAxis
        sparkline
        hideMinMaxLines
        overrideColor={lineColor}
      />
    )
  }

  return <ChartUnavailableOverlay height={CHART_HEIGHT} chartTransform="translate(5, -70)" />
}

function TokenHoverCardContentInner({
  currencyInfo,
  isMultichainAsset,
  price,
  pricePercentChange,
  priceAbsoluteChange,
  priceData,
  chartLoading = false,
  isCopied = false,
  onCopy,
  onExpand,
  maxWidth,
}: TokenHoverCardContentProps): JSX.Element {
  const colors = useSporeColors()
  const { formatNumberOrString } = useLocalizationContext()

  const formattedPrice = formatNumberOrString({
    value: price ?? undefined,
    type: NumberType.FiatTokenPrice,
  })

  const hasPrice = price != null
  const hasChange = pricePercentChange != null || priceAbsoluteChange != null
  const hasChartData = priceData != null && priceData.length > 1
  const isNoData = !chartLoading && !hasPrice && !hasChange && !hasChartData

  const isPositive = useMemo(() => {
    const direction = pricePercentChange ?? priceAbsoluteChange
    if (direction != null) {
      return direction >= 0
    }
    if (priceData && priceData.length >= 2) {
      return priceData[priceData.length - 1].value >= priceData[0].value
    }
    return true
  }, [pricePercentChange, priceAbsoluteChange, priceData])
  const lineColor = isPositive ? colors.statusSuccess.val : colors.statusCritical.val

  return (
    <Flex gap="$spacing8" width={getTokenHoverCardContentWidth(maxWidth)}>
      {/* Token identity row */}
      <Flex row justifyContent="space-between" alignItems="center">
        <Flex row gap="$spacing8" alignItems="center" flex={1} minWidth={0}>
          <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} hideNetworkLogo={isMultichainAsset} />
          <Text variant="body2" color="$neutral2" numberOfLines={1}>
            {currencyInfo.currency.symbol}
          </Text>
        </Flex>
        <Flex row gap="$spacing8" alignItems="center">
          {onCopy && (
            <TouchableArea hoverStyle={{ opacity: 0.7 }} onPress={onCopy}>
              <AnimatableCopyIcon isCopied={isCopied} size={iconSizes.icon16} textColor="$neutral2" />
            </TouchableArea>
          )}
          {onExpand && (
            <TouchableArea hoverStyle={{ opacity: 0.7 }} onPress={onExpand}>
              <ArrowsExpand color="$neutral2" size={iconSizes.icon12} />
            </TouchableArea>
          )}
        </Flex>
      </Flex>

      {isNoData ? (
        <NoDataState />
      ) : (
        <>
          {(chartLoading || hasPrice || hasChange) && (
            <PriceAndChangeRow
              loading={chartLoading}
              formattedPrice={formattedPrice}
              hasChange={hasChange}
              pricePercentChange={pricePercentChange}
              priceAbsoluteChange={priceAbsoluteChange}
            />
          )}
          <HoverCardChart
            loading={chartLoading}
            hasChartData={hasChartData}
            priceData={priceData}
            lineColor={lineColor}
          />
        </>
      )}
    </Flex>
  )
}

export const TokenHoverCardContent = memo(TokenHoverCardContentInner)

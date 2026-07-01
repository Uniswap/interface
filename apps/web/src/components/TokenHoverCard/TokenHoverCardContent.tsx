import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatableCopyIcon, Flex, Skeleton, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowsExpand } from 'ui/src/components/icons/ArrowsExpand'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { PriceChartBody, PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'

const CHART_HEIGHT = 104
const CHART_WIDTH = 240

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

function TokenHoverCardContentInner({
  currencyInfo,
  isMultichainAsset,
  price,
  pricePercentChange,
  priceAbsoluteChange,
  priceData,
  chartLoading,
  isCopied = false,
  onCopy,
  onExpand,
  maxWidth,
}: TokenHoverCardContentProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatNumberOrString } = useLocalizationContext()

  const formattedPrice = formatNumberOrString({
    value: price ?? undefined,
    type: NumberType.FiatTokenPrice,
  })

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
    <Flex
      gap="$spacing8"
      width={maxWidth !== undefined ? Math.min(CHART_WIDTH, Math.max(0, Math.floor(maxWidth))) : CHART_WIDTH}
    >
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

      {/* Price + 24h change */}
      <Flex gap="$spacing4">
        {chartLoading ? (
          <Skeleton>
            <Flex width={120} height={28} borderRadius="$rounded8" backgroundColor="$neutral3" />
          </Skeleton>
        ) : (
          <Text variant="heading3" color="$neutral1">
            {formattedPrice}
          </Text>
        )}
        {chartLoading ? (
          <Skeleton>
            <Flex width={100} height={16} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
        ) : (
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
        )}
      </Flex>

      {/* Sparkline — reuses PriceChartBody (lightweight-charts area series) with dotted bg and live dot */}
      {chartLoading ? (
        <ChartSkeleton
          type={ChartType.PRICE}
          height={CHART_HEIGHT}
          hideYAxis
          hideXAxis
          hidePriceIndicators
          chartTransform="translate(5, -70)"
        />
      ) : priceData && priceData.length > 1 ? (
        <PriceChartBody
          data={priceData}
          height={CHART_HEIGHT}
          type={PriceChartType.LINE}
          stale={false}
          hideYAxis
          sparkline
          hideMinMaxLines
          overrideColor={lineColor}
        />
      ) : null}
    </Flex>
  )
}

export const TokenHoverCardContent = memo(TokenHoverCardContentInner)

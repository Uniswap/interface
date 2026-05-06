import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { Flex, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { useChartDragState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/dragSelectors'
import { useChartHoverState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/hoverSelectors'
import { useLiquidityChartStoreRenderingContext } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import { findClosestPriceDataPoint } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/timeUtils'
import { getDisplayPriceFromTick } from '~/features/Liquidity/utils/getTickToPrice'

function formatDataPointDate(time: number, locale: string): string {
  const date = new Date(time * 1000)
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PriceTooltip({
  quoteCurrency,
  baseCurrency,
  priceInverted,
  protocolVersion,
}: {
  quoteCurrency: Maybe<Currency>
  baseCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}) {
  const { hoverPriceX, hoverPriceY, isChartHovered, hoveredTick } = useChartHoverState()
  const { dragStartY } = useChartDragState()
  const renderingContext = useLiquidityChartStoreRenderingContext()
  const { formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()

  // Don't show over the liquidity bars section (hoveredTick is set only when over bars)
  if (
    !isChartHovered ||
    hoverPriceX === undefined ||
    hoverPriceY === undefined ||
    dragStartY !== null ||
    !renderingContext ||
    hoveredTick
  ) {
    return null
  }

  const { priceData, dimensions, priceToY } = renderingContext

  // Only show in the price chart area (left of liquidity bars)
  if (hoverPriceX >= dimensions.width) {
    return null
  }

  const closest = findClosestPriceDataPoint({ priceData, mouseX: hoverPriceX, chartWidth: dimensions.width })
  if (!closest) {
    return null
  }

  const tick = Math.round(renderingContext.yToTick(priceToY({ price: closest.value })))
  const price = getDisplayPriceFromTick({ tick, baseCurrency, quoteCurrency, priceInverted, protocolVersion })
  if (price === undefined) {
    return null
  }

  const formattedPrice = formatNumberOrString({ value: price, type: NumberType.TokenTx })
  const formattedDate = formatDataPointDate(closest.time, locale)

  // Snap tooltip Y to the actual price line position
  const dataPointY = priceToY({ price: closest.value })
  const atTop = dataPointY < 20
  const atBottom = CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT - dataPointY < 20

  // Compute the dot's actual snapped X so the tooltip stays beside the indicator
  const firstMs = priceData[0].time * 1000
  const lastMs = priceData[priceData.length - 1].time * 1000
  const totalMs = lastMs - firstMs
  const snappedX = totalMs === 0 ? 0 : ((closest.time * 1000 - firstMs) / totalMs) * dimensions.width

  // Position to the right of the dot indicator, flip left if near the right edge.
  // CSS `right` is measured from the containing block's right edge, which includes
  // the liquidity bars section (LIQUIDITY_CHART_WIDTH), so we add that offset.
  const dotGap = CHART_DIMENSIONS.PRICE_DOT_RADIUS + 8
  const flipLeft = snappedX > dimensions.width * 0.6
  const tooltipLeft = flipLeft ? undefined : snappedX + dotGap
  const tooltipRight = flipLeft
    ? dimensions.width + CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - snappedX + dotGap
    : undefined

  return (
    <Flex
      position="absolute"
      top={dataPointY - 18}
      left={tooltipLeft}
      right={tooltipRight}
      transform={atBottom ? 'translateY(-12px)' : atTop ? 'translateY(14px)' : undefined}
      p="$padding8"
      gap="$gap4"
      borderRadius="$rounded12"
      borderColor="$surface3"
      borderWidth="$spacing1"
      backgroundColor="$surface2"
      pointerEvents="none"
      zIndex={zIndexes.tooltip}
    >
      <Text variant="body4" color="$neutral2">
        {formattedDate}
      </Text>
      <Text variant="body4" color="$neutral1">
        {formattedPrice}
        {quoteCurrency && baseCurrency && (
          <Text variant="body4" color="$neutral2">
            {' '}
            {baseCurrency.symbol}/{quoteCurrency.symbol}
          </Text>
        )}
      </Text>
    </Flex>
  )
}

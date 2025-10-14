import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { useChartHoverState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/hoverSelectors'
import { useChartPriceState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import {
  useLiquidityChartStorePriceDifferences,
  useLiquidityChartStoreRenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import { RangeAmountInputPriceMode } from 'components/Liquidity/Create/types'
import { Flex, Text } from 'ui/src'

function PriceDifferenceTooltip({
  lineY,
  priceDiff,
  containerHeight,
}: {
  lineY: number
  priceDiff: string
  containerHeight: number
}) {
  const atTop = lineY < 20
  const atBottom = containerHeight - lineY < 20

  return (
    <Flex
      position="absolute"
      top={lineY}
      left={8}
      transform={atBottom ? 'translateY(-12px)' : atTop ? 'translateY(14px)' : undefined}
      p="$padding8"
      borderRadius="$rounded12"
      borderColor="$surface3"
      borderWidth="$spacing1"
      backgroundColor="$surface2"
      pointerEvents="none"
      minWidth={60}
      alignItems="center"
      justifyContent="center"
    >
      <Text variant="body4" color="$neutral1" fontWeight="500">
        {priceDiff}
      </Text>
    </Flex>
  )
}

export function PriceDifferenceTooltips() {
  const { isChartHovered } = useChartHoverState()
  const { minPrice, maxPrice, inputMode } = useChartPriceState()
  const priceDifferences = useLiquidityChartStorePriceDifferences()
  const renderingContext = useLiquidityChartStoreRenderingContext()

  // Only show tooltips when hovering the chart and we have the required data
  const shouldShow =
    (inputMode === RangeAmountInputPriceMode.PERCENTAGE || isChartHovered) &&
    minPrice &&
    maxPrice &&
    priceDifferences &&
    renderingContext

  return (
    <>
      {shouldShow ? (
        <>
          {/* Min price tooltip */}
          {priceDifferences.minPriceDiff ? (
            <PriceDifferenceTooltip
              containerHeight={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT}
              lineY={renderingContext.priceToY({ price: minPrice })}
              priceDiff={priceDifferences.minPriceDiffFormatted}
            />
          ) : null}

          {/* Max price tooltip */}
          {priceDifferences.maxPriceDiff ? (
            <PriceDifferenceTooltip
              containerHeight={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT}
              lineY={renderingContext.priceToY({ price: maxPrice })}
              priceDiff={priceDifferences.maxPriceDiffFormatted}
            />
          ) : null}
        </>
      ) : null}
    </>
  )
}

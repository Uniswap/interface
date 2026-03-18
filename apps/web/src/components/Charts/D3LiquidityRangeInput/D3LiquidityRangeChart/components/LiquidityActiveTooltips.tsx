import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { TickTooltip } from '~/components/Charts/ActiveLiquidityChart/TickTooltip'
import { PriceDifferenceTooltips } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/PriceDifferenceTooltips'
import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { useChartDragState } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/dragSelectors'
import { useChartHoverState } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/hoverSelectors'
import { getDisplayPriceFromTick } from '~/utils/getTickToPrice'

export function LiquidityActiveTooltips({
  quoteCurrency,
  baseCurrency,
  currentTick,
  tickSpacing,
  priceInverted,
  protocolVersion,
}: {
  quoteCurrency: Maybe<Currency>
  baseCurrency: Maybe<Currency>
  currentTick: number
  tickSpacing: number
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}) {
  const { dragStartY, dragCurrentY, dragStartTick, dragCurrentTick } = useChartDragState()
  const { hoveredY, hoveredTick } = useChartHoverState()

  // Calculate current price for TickTooltip
  const currentPrice = Number(
    getDisplayPriceFromTick({
      tick: currentTick,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
    }),
  )

  // Calculate content width and axis label pane width
  const contentWidth = CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH - CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET
  const axisLabelPaneWidth = CHART_DIMENSIONS.LIQUIDITY_SECTION_OFFSET

  return (
    <>
      {/* Price difference tooltips - show on hover only */}
      <PriceDifferenceTooltips />

      {/* Hover tooltip (only show when not dragging) */}
      {hoveredY && hoveredTick && dragStartY === null ? (
        <TickTooltip
          containerHeight={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT}
          hoverY={hoveredY}
          hoveredTick={hoveredTick}
          currentTick={currentTick}
          currentPrice={currentPrice}
          contentWidth={contentWidth}
          axisLabelPaneWidth={axisLabelPaneWidth}
          quoteCurrency={quoteCurrency}
          baseCurrency={baseCurrency}
          tickSpacing={tickSpacing}
        />
      ) : null}

      {/* Drag start tooltip */}
      {dragStartY !== null && dragStartTick ? (
        <TickTooltip
          containerHeight={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT}
          hoverY={dragStartY}
          hoveredTick={dragStartTick}
          currentTick={currentTick}
          currentPrice={currentPrice}
          contentWidth={contentWidth}
          axisLabelPaneWidth={axisLabelPaneWidth}
          quoteCurrency={quoteCurrency}
          baseCurrency={baseCurrency}
          tickSpacing={tickSpacing}
        />
      ) : null}

      {/* Drag current tooltip */}
      {dragCurrentY !== undefined && dragCurrentTick ? (
        <TickTooltip
          containerHeight={CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT}
          hoverY={dragCurrentY}
          hoveredTick={dragCurrentTick}
          currentTick={currentTick}
          currentPrice={currentPrice}
          contentWidth={contentWidth}
          axisLabelPaneWidth={axisLabelPaneWidth}
          quoteCurrency={quoteCurrency}
          baseCurrency={baseCurrency}
          tickSpacing={tickSpacing}
        />
      ) : null}
    </>
  )
}

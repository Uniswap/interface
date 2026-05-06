import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { TickTooltip } from '~/features/Liquidity/charts/ActiveLiquidityChart/TickTooltip'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { PriceDifferenceTooltips } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/PriceDifferenceTooltips'
import { PriceTooltip } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/PriceTooltip'
import { useChartDragState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/dragSelectors'
import { useChartHoverState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/hoverSelectors'
import { getDisplayPriceFromTick } from '~/features/Liquidity/utils/getTickToPrice'

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

      {/* Price tooltip - shows hovered price on the right edge of the price chart */}
      <PriceTooltip
        quoteCurrency={quoteCurrency}
        baseCurrency={baseCurrency}
        priceInverted={priceInverted}
        protocolVersion={protocolVersion}
      />

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

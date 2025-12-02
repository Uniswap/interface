import { COORDINATE_SCALING, LABEL_CONFIG } from 'components/Toucan/Auction/BidDistributionChart/constants'
import {
  calculateDynamicLabelIncrement,
  formatTickForDisplay,
} from 'components/Toucan/Auction/BidDistributionChart/utils/utils'
import { BidTokenInfo, DisplayMode } from 'components/Toucan/Auction/store/types'
import { IChartApi, UTCTimestamp } from 'lightweight-charts'
import { useCallback } from 'react'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'

interface UseChartLabelsParams {
  minTick: number
  maxTick: number
  labelIncrement: number | undefined
  tickSize: number
  displayMode: DisplayMode
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals: number
  formatter: (amount: number) => string
  colors: UseSporeColorsReturn
}

/**
 * Hook for managing custom x-axis labels on the chart
 */
export function useChartLabels(params: UseChartLabelsParams) {
  const { tickSize, displayMode, bidTokenInfo, totalSupply, auctionTokenDecimals, formatter, colors } = params

  /**
   * Creates a single label DOM element with proper styling and positioning
   */
  const createLabelElement = useCallback(
    (params: { tickValue: number; x: number; plotLeft: number }): HTMLDivElement => {
      const { tickValue, x, plotLeft } = params
      const label = document.createElement('div')
      Object.assign(label.style, {
        position: 'absolute',
        left: `${x + plotLeft}px`,
        bottom: '0',
        transform: 'translateX(-50%)', // Center label on the x coordinate
        color: colors.neutral2.val,
        fontSize: `${LABEL_CONFIG.FONT_SIZE}px`,
        lineHeight: `${LABEL_CONFIG.LINE_HEIGHT}px`,
        whiteSpace: 'nowrap',
      })

      // Format label based on display mode
      const formattedValue = formatTickForDisplay({
        tickValue,
        displayMode,
        bidTokenInfo,
        totalSupply,
        auctionTokenDecimals,
        formatter,
      })
      label.textContent = formattedValue

      return label
    },
    [displayMode, bidTokenInfo, totalSupply, auctionTokenDecimals, formatter, colors.neutral2.val],
  )

  /**
   * Renders custom x-axis labels at evenly spaced intervals
   * Dynamically calculates label increment based on the visible range
   */
  const renderLabels = useCallback(
    (params: { labelsLayer: HTMLDivElement; chart: IChartApi; plotLeft: number }) => {
      const { labelsLayer, chart, plotLeft } = params
      labelsLayer.innerHTML = ''

      // Get the current visible range from the chart
      // Wrap in try-catch because lightweight-charts throws an error instead of returning null
      // when the chart is not fully initialized (e.g., on initial load or display mode change)
      let visibleRange
      try {
        visibleRange = chart.timeScale().getVisibleRange()
      } catch {
        // Chart not initialized yet, skip rendering labels
        return
      }

      // Guard against null - chart may not be initialized yet
      if (!visibleRange) {
        return
      }

      // Convert visible range from scaled coordinates to tick values
      const visibleFromTick = (visibleRange.from as number) / COORDINATE_SCALING.PRICE_SCALE_FACTOR
      const visibleToTick = (visibleRange.to as number) / COORDINATE_SCALING.PRICE_SCALE_FACTOR

      // Calculate dynamic label increment based on currently visible range
      const dynamicLabelIncrement = calculateDynamicLabelIncrement({
        visibleFrom: visibleFromTick,
        visibleTo: visibleToTick,
        tickSize,
      })

      // Find the first label index (multiple of dynamicLabelIncrement that's >= visibleFromTick)
      const startIndex = Math.ceil(visibleFromTick / dynamicLabelIncrement)
      const endIndex = Math.floor(visibleToTick / dynamicLabelIncrement)

      // Generate labels using multiplier index to avoid floating-point drift
      for (let multiplierIndex = startIndex; multiplierIndex <= endIndex; multiplierIndex++) {
        // Calculate tick value directly from multiplier (avoids floating-point errors)
        const tickValue = multiplierIndex * dynamicLabelIncrement

        // Convert tick value to time coordinate (must match bar data points)
        const timeValue = Math.round(tickValue * COORDINATE_SCALING.PRICE_SCALE_FACTOR) as UTCTimestamp
        const x = chart.timeScale().timeToCoordinate(timeValue)

        // Skip if calculated label position doesn't correspond to an actual data point
        // (timeToCoordinate returns null when the time value doesn't exist in the chart's data)
        if (x == null) {
          continue
        }

        const label = createLabelElement({ tickValue, x, plotLeft })
        labelsLayer.appendChild(label)
      }
    },
    [tickSize, createLabelElement],
  )

  return { renderLabels }
}

import { IChartApi, UTCTimestamp } from 'lightweight-charts'
import { useCallback } from 'react'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { LABEL_CONFIG } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { formatTokenPriceSubscript } from '~/components/Toucan/Auction/BidDistributionChart/utils/tokenFormatters'
import { calculateDynamicLabelIncrement } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'

interface UseChartLabelsParams {
  minTick: number
  maxTick: number
  labelIncrement: number | undefined
  tickSize: number
  colors: UseSporeColorsReturn
  priceScaleFactor: number
  targetMaxLabels?: number
}

/**
 * Hook for managing custom x-axis labels on the chart
 */
export function useChartLabels(params: UseChartLabelsParams) {
  const { tickSize, colors, targetMaxLabels } = params

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
        height: `${LABEL_CONFIG.HEIGHT}px`,
        paddingBottom: `${LABEL_CONFIG.PADDING_BOTTOM}px`,
        whiteSpace: 'nowrap',
      })

      // Format as token price with subscript notation for small values
      // Use innerHTML with styled HTML to make subscript more readable
      const formatted = formatTokenPriceSubscript(tickValue, {
        minSigDigits: 3,
        maxSigDigits: 4,
      })
      // eslint-disable-next-line no-unsanitized/property -- HTML is generated from number, not user input
      label.innerHTML = formatted.html

      return label
    },
    [colors.neutral2.val],
  )

  /**
   * Renders custom x-axis labels at evenly spaced intervals
   * Dynamically calculates label increment based on the visible range
   */
  const renderLabels = useCallback(
    (params: {
      labelsLayer: HTMLDivElement
      chart: IChartApi
      plotLeft: number
      plotWidth: number
      priceScaleFactor: number
    }) => {
      const { labelsLayer, chart, plotLeft, plotWidth, priceScaleFactor: localPriceScaleFactor } = params

      // Get the current visible range from the chart
      // Wrap in try-catch because lightweight-charts throws an error instead of returning null
      // when the chart is not fully initialized (e.g., on initial load or display mode change)
      let visibleRange
      try {
        visibleRange = chart.timeScale().getVisibleRange()
      } catch {
        // Chart not initialized yet, skip rendering labels (keep existing labels to avoid flicker)
        return
      }

      // Guard against null - chart may not be initialized yet
      if (!visibleRange) {
        return
      }

      // Convert visible range from scaled coordinates to tick values
      const visibleFromTick = (visibleRange.from as number) / localPriceScaleFactor
      const visibleToTick = (visibleRange.to as number) / localPriceScaleFactor

      const getInterpolatedCoordinate = (tickValue: number): number | null => {
        // When ticks are grouped, many tick-aligned label times won't exist in the series data,
        // so `timeToCoordinate` returns null. Fall back to interpolating across the current visible
        // *time* range endpoints (more stable during panning than logical coords).
        const xFrom = chart.timeScale().timeToCoordinate(visibleRange.from as UTCTimestamp)
        const xTo = chart.timeScale().timeToCoordinate(visibleRange.to as UTCTimestamp)
        if (xFrom == null || xTo == null) {
          return null
        }

        const denom = visibleToTick - visibleFromTick
        if (!Number.isFinite(denom) || denom === 0) {
          return null
        }

        const ratio = (tickValue - visibleFromTick) / denom
        if (!Number.isFinite(ratio)) {
          return null
        }

        return xFrom + ratio * (xTo - xFrom)
      }

      const nextLabels = document.createDocumentFragment()
      let renderedCount = 0

      // Calculate dynamic label increment based on currently visible range
      const dynamicLabelIncrement = calculateDynamicLabelIncrement({
        visibleFrom: visibleFromTick,
        visibleTo: visibleToTick,
        tickSize,
        targetMaxLabels,
      })

      // Find the first label index (multiple of dynamicLabelIncrement that's >= visibleFromTick)
      const startIndex = Math.ceil(visibleFromTick / dynamicLabelIncrement)
      const endIndex = Math.floor(visibleToTick / dynamicLabelIncrement)

      // Generate labels using multiplier index to avoid floating-point drift
      for (let multiplierIndex = startIndex; multiplierIndex <= endIndex; multiplierIndex++) {
        // Calculate tick value directly from multiplier (avoids floating-point errors)
        const tickValue = multiplierIndex * dynamicLabelIncrement

        // Convert tick value to time coordinate (must match bar data points)
        const timeValue = Math.round(tickValue * localPriceScaleFactor) as UTCTimestamp
        const x = chart.timeScale().timeToCoordinate(timeValue) ?? getInterpolatedCoordinate(tickValue)

        // Skip if we can't compute a usable position (chart may not be ready yet)
        if (x == null) {
          continue
        }

        const label = createLabelElement({ tickValue, x, plotLeft })
        nextLabels.appendChild(label)
        renderedCount++
      }

      // Only swap the DOM when we successfully rendered something; avoids label flicker/disappear during panning.
      if (renderedCount > 0) {
        labelsLayer.innerHTML = ''
        labelsLayer.appendChild(nextLabels)

        const labelElements = Array.from(labelsLayer.children) as HTMLDivElement[]

        // Batch read all measurements first to avoid layout thrashing
        const measurements = labelElements.map((label) => ({
          label,
          width: label.offsetWidth,
          left: Number.parseFloat(label.style.left || '0'),
        }))

        // Then batch write visibility
        for (const { label, width, left } of measurements) {
          if (!width) {
            continue
          }
          const minLeft = width / 2
          const maxLeft = plotWidth - width / 2
          const isOutOfBounds = left < minLeft || left > maxLeft
          label.style.display = isOutOfBounds ? 'none' : 'block'
        }
      }
    },
    [tickSize, targetMaxLabels, createLabelElement],
  )

  return { renderLabels }
}

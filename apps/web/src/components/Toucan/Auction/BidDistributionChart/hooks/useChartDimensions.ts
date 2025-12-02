import type { IChartApi } from 'lightweight-charts'
import { useCallback } from 'react'

/**
 * Hook for calculating distribution chart dimensions and offsets
 */
export function useChartDimensions() {
  /**
   * Calculate the plot area dimensions (where bars are actually rendered)
   * Returns left offset and width of the clipped plot area
   */
  const getPlotDimensions = useCallback(
    (containerRef: HTMLDivElement | null, chart: IChartApi | null): { left: number; width: number } => {
      if (!containerRef || !chart) {
        return { left: 0, width: 0 }
      }

      const left = chart.priceScale('left').width()
      const width = chart.paneSize().width

      return { left: Math.round(left), width: Math.round(width) }
    },
    [],
  )

  return { getPlotDimensions }
}

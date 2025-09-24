import { CHART_BEHAVIOR } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { useChartPriceState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { ChartState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { boundPanY } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/boundPanY'
import { calculateDynamicZoomMin } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/chartUtils'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { useEffect } from 'react'

export function useLiquidityChartInteractions({
  svgRef,
  liquidityData,
  zoomLevel,
  panY,
  setChartState,
  dynamicZoomMin,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  liquidityData: ChartEntry[]
  zoomLevel?: number
  panY?: number
  setChartState: (state: Partial<ChartState>) => void
  dynamicZoomMin?: number
}) {
  const { isFullRange } = useChartPriceState()

  useEffect(() => {
    const svgElement = svgRef.current
    if (!svgElement) {
      return
    }

    if (zoomLevel === undefined || panY === undefined || isFullRange) {
      return
    }

    // Setup wheel event handler for tick-based scrolling and pinch zoom
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const viewportHeight = svgElement.clientHeight

      // Check if this is a zoom gesture (Ctrl+wheel)
      if (event.ctrlKey) {
        const rect = svgElement.getBoundingClientRect()
        const centerY = event.clientY - rect.top

        // Calculate zoom based on wheel delta
        const deltaScale = -event.deltaY * CHART_BEHAVIOR.PINCH_DELTA_SCALE
        const zoomFactor = Math.max(
          CHART_BEHAVIOR.PINCH_ZOOM_FACTOR_MIN,
          Math.min(CHART_BEHAVIOR.PINCH_ZOOM_FACTOR_MAX, 1 + deltaScale),
        )

        const minZoom = dynamicZoomMin ?? calculateDynamicZoomMin(liquidityData.length)
        const newZoomLevel = Math.max(minZoom, Math.min(CHART_BEHAVIOR.ZOOM_MAX, zoomLevel * zoomFactor))

        // Adjust panY to keep mouse position fixed during zoom
        const zoomRatio = newZoomLevel / zoomLevel
        const newPanY = centerY - (centerY - panY) * zoomRatio

        const constrainedPanY = boundPanY({ panY: newPanY, viewportHeight, liquidityData, zoomLevel: newZoomLevel })

        setChartState({ zoomLevel: newZoomLevel, panY: constrainedPanY })
      } else {
        const scrollAmount = -event.deltaY
        const newPanY = panY + scrollAmount

        const constrainedPanY = boundPanY({ panY: newPanY, viewportHeight, liquidityData, zoomLevel })

        setChartState({ panY: constrainedPanY })
      }
    }

    // Add event listeners
    svgElement.addEventListener('wheel', handleWheel, { passive: false })

    // eslint-disable-next-line consistent-return
    return () => {
      svgElement.removeEventListener('wheel', handleWheel)
    }
  }, [liquidityData, zoomLevel, panY, dynamicZoomMin, isFullRange, setChartState, svgRef])
}

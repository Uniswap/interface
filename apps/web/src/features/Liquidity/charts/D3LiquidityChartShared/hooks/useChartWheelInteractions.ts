import { useEffect } from 'react'
import { CHART_BEHAVIOR } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'

/**
 * Shared wheel interaction hook for D3 liquidity charts.
 * Handles ctrl+wheel (zoom) and regular wheel (pan) on both axes.
 *
 * @param onBoundPan - Chart-specific pan bounding function
 * @param calculateMaxZoom - Chart-specific max zoom calculator
 */
export function useChartWheelInteractions({
  svgRef,
  zoom,
  pan,
  onZoomPan,
  onBoundPan,
  calculateMaxZoom,
  viewportSize,
  tickSpacing,
  disabled = false,
  getScrollDelta,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  zoom: number
  pan: number
  onZoomPan: (state: { zoom: number; pan: number }) => void
  onBoundPan: (args: { pan: number; viewportSize: number; zoomLevel: number }) => number
  calculateMaxZoom: (tickSpacing: number, viewportSize: number) => number
  viewportSize: number
  tickSpacing: number
  disabled?: boolean
  /** Extract the relevant scroll delta and cursor position from the wheel event */
  getScrollDelta: (event: WheelEvent, rect: DOMRect) => { scrollDelta: number; cursorPosition: number }
}) {
  useEffect(() => {
    const svgElement = svgRef.current
    if (!svgElement || disabled) {
      return undefined
    }

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault()
      event.stopPropagation()

      const rect = svgElement.getBoundingClientRect()
      const { scrollDelta, cursorPosition } = getScrollDelta(event, rect)

      // Ctrl+wheel = zoom (pinch gesture)
      if (event.ctrlKey) {
        const deltaScale = -event.deltaY * CHART_BEHAVIOR.PINCH_DELTA_SCALE
        const zoomFactor = Math.max(
          CHART_BEHAVIOR.PINCH_ZOOM_FACTOR_MIN,
          Math.min(CHART_BEHAVIOR.PINCH_ZOOM_FACTOR_MAX, 1 + deltaScale),
        )

        const maxZoom = calculateMaxZoom(tickSpacing, viewportSize)
        const newZoom = Math.max(CHART_BEHAVIOR.ZOOM_MIN, Math.min(maxZoom, zoom * zoomFactor))

        // Adjust pan to keep cursor position fixed during zoom
        const zoomRatio = newZoom / zoom
        const newPan = cursorPosition - (cursorPosition - pan) * zoomRatio

        const constrainedPan = onBoundPan({ pan: newPan, viewportSize, zoomLevel: newZoom })
        onZoomPan({ zoom: newZoom, pan: constrainedPan })
      } else {
        // Regular scroll = pan
        const newPan = pan + scrollDelta
        const constrainedPan = onBoundPan({ pan: newPan, viewportSize, zoomLevel: zoom })
        onZoomPan({ zoom, pan: constrainedPan })
      }
    }

    svgElement.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      svgElement.removeEventListener('wheel', handleWheel)
    }
  }, [zoom, pan, onZoomPan, svgRef, tickSpacing, viewportSize, disabled, onBoundPan, calculateMaxZoom, getScrollDelta])
}

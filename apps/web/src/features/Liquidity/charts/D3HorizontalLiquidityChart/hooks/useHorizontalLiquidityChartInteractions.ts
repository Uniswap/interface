import { useCallback } from 'react'
import type { HorizontalLiquidityChartState } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/types'
import { useChartWheelInteractions } from '~/features/Liquidity/charts/D3LiquidityChartShared/hooks/useChartWheelInteractions'
import { boundPan } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/boundPan'
import { calculateHorizontalMaxZoom } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/viewportUtils'

export function useHorizontalLiquidityChartInteractions({
  svgRef,
  zoomLevel,
  panX,
  setChartState,
  tickSpacing,
  chartWidth,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  zoomLevel?: number
  panX?: number
  setChartState: (state: Partial<HorizontalLiquidityChartState>) => void
  tickSpacing: number
  chartWidth: number
}) {
  const onZoomPan = useCallback(
    ({ zoom, pan }: { zoom: number; pan: number }) => {
      setChartState({ zoomLevel: zoom, panX: pan })
    },
    [setChartState],
  )

  const onBoundPan = useCallback(
    ({ pan, viewportSize, zoomLevel: zl }: { pan: number; viewportSize: number; zoomLevel: number }) =>
      boundPan({ pan, viewportSize, contentSize: viewportSize, zoomLevel: zl }),
    [],
  )

  const getScrollDelta = useCallback((event: WheelEvent, rect: DOMRect) => {
    // Use deltaX for horizontal scroll, fall back to deltaY for vertical scroll wheels
    const scrollDelta = event.deltaX !== 0 ? -event.deltaX : -event.deltaY
    return {
      scrollDelta,
      cursorPosition: event.clientX - rect.left,
    }
  }, [])

  useChartWheelInteractions({
    svgRef,
    zoom: zoomLevel ?? 1,
    pan: panX ?? 0,
    onZoomPan,
    onBoundPan,
    calculateMaxZoom: calculateHorizontalMaxZoom,
    viewportSize: chartWidth,
    tickSpacing,
    disabled: zoomLevel === undefined || panX === undefined,
    getScrollDelta,
  })
}

import { useCallback } from 'react'
import { CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { useChartWheelInteractions } from '~/features/Liquidity/charts/D3LiquidityChartShared/hooks/useChartWheelInteractions'
import { boundPan } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/boundPan'
import { calculateMaxZoom } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/viewportUtils'
import { useChartPriceState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { ChartState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'

export function useLiquidityChartInteractions({
  svgRef,
  zoomLevel,
  panY,
  setChartState,
  tickSpacing,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  zoomLevel?: number
  panY?: number
  setChartState: (state: Partial<ChartState>) => void
  tickSpacing: number
}) {
  const { isFullRange } = useChartPriceState()

  const onZoomPan = useCallback(
    ({ zoom, pan }: { zoom: number; pan: number }) => {
      setChartState({ zoomLevel: zoom, panY: pan })
    },
    [setChartState],
  )

  const onBoundPan = useCallback(
    ({ pan, viewportSize, zoomLevel: zl }: { pan: number; viewportSize: number; zoomLevel: number }) =>
      boundPan({ pan, viewportSize, contentSize: CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT, zoomLevel: zl }),
    [],
  )

  const getScrollDelta = useCallback((event: WheelEvent, rect: DOMRect) => {
    return {
      scrollDelta: -event.deltaY,
      cursorPosition: event.clientY - rect.top,
    }
  }, [])

  const maxZoomFn = useCallback((ts: number, _viewportSize: number) => calculateMaxZoom(ts), [])

  useChartWheelInteractions({
    svgRef,
    zoom: zoomLevel ?? 1,
    pan: panY ?? 0,
    onZoomPan,
    onBoundPan,
    calculateMaxZoom: maxZoomFn,
    viewportSize: svgRef.current?.clientHeight ?? 0,
    tickSpacing,
    disabled: zoomLevel === undefined || panY === undefined || isFullRange,
    getScrollDelta,
  })
}

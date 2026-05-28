import { ZoomButtons as SharedZoomButtons } from '~/features/Liquidity/charts/D3LiquidityChartShared/components/ZoomButtons'
import { useChartPriceState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useLiquidityChartStoreActions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'

export function ZoomButtons() {
  const { zoomIn, centerRange, zoomOut } = useLiquidityChartStoreActions()
  const { isFullRange } = useChartPriceState()

  return <SharedZoomButtons onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={centerRange} resetDisabled={isFullRange} />
}

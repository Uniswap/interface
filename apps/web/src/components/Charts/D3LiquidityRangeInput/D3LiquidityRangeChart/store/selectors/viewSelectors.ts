import { LiquidityChartStoreContext } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import { useContext } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

function useLiquidityChartStore() {
  const store = useContext(LiquidityChartStoreContext)
  if (!store) {
    throw new Error('useLiquidityChartStore must be used within a LiquidityChartStoreProvider')
  }
  return store
}

export const useChartViewState = () => {
  const store = useLiquidityChartStore()
  return useStore(
    store,
    useShallow((s) => ({
      dimensions: s.dimensions,
      dynamicZoomMin: s.dynamicZoomMin,
      initialViewSet: s.initialViewSet,
      inputMode: s.inputMode,
      panY: s.panY,
      zoomLevel: s.zoomLevel,
    })),
  )
}

export const useLiquidityChartStoreRenderingContext = () => {
  const store = useLiquidityChartStore()
  return useStore(store, (s) => s.renderingContext)
}

export const useLiquidityChartStorePriceDifferences = ():
  | {
      minPriceDiffFormatted: string
      maxPriceDiffFormatted: string
      minPriceDiff: number | undefined
      maxPriceDiff: number | undefined
    }
  | undefined => {
  const store = useLiquidityChartStore()
  const { formatPercent } = useLocalizationContext()

  return useStore(
    store,
    useShallow((s) => {
      const currentPrice = s.renderingContext?.priceData[s.renderingContext.priceData.length - 1]?.value
      const { minPrice, maxPrice, isFullRange } = s

      if (!currentPrice || !minPrice || !maxPrice || isFullRange) {
        return {
          minPriceDiffFormatted: '',
          maxPriceDiffFormatted: '',
          minPriceDiff: undefined,
          maxPriceDiff: undefined,
        }
      }

      const minPriceDiffNum = ((minPrice - currentPrice) / currentPrice) * 100
      const maxPriceDiffNum = ((maxPrice - currentPrice) / currentPrice) * 100

      const formatDiff = (diff: number) => {
        const formatted = formatPercent(diff)
        return diff >= 0 ? `+${formatted}` : formatted
      }

      return {
        minPriceDiffFormatted: formatDiff(minPriceDiffNum),
        maxPriceDiffFormatted: formatDiff(maxPriceDiffNum),
        minPriceDiff: minPriceDiffNum,
        maxPriceDiff: maxPriceDiffNum,
      }
    }),
  )
}

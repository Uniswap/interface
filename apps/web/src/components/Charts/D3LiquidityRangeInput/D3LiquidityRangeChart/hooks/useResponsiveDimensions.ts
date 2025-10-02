import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { useEffect, useState } from 'react'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions/useDeviceDimensions'

export function useResponsiveDimensions() {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    isInitialized: false,
  })

  const deviceDimensions = useDeviceDimensions()

  // biome-ignore lint/correctness/useExhaustiveDependencies: +deviceDimensions
  useEffect(() => {
    const calculateDimensions = () => {
      const chartContainer = document.getElementById('d3-liquidity-range-input')

      if (!chartContainer) {
        return
      }

      const { width, height } = {
        width: chartContainer.clientWidth - CHART_DIMENSIONS.LIQUIDITY_CHART_WIDTH,
        height: CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT,
      }

      setDimensions((prev) => {
        if (prev.width !== width) {
          return { width, height, isInitialized: true }
        }
        return prev
      })
    }

    const animationId = requestAnimationFrame(calculateDimensions)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [deviceDimensions])

  return dimensions
}

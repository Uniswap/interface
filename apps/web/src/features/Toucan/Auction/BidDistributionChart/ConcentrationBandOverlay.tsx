import { useMemo } from 'react'
import { Flex } from 'ui/src'
import type { ProcessedChartData } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'

interface ConcentrationBandOverlayProps {
  /** Concentration band from processed chart data */
  concentration: ProcessedChartData['concentration']
  /** Visible price range from clearing price chart Y-axis (in scaled space) */
  priceRange: { min: number; max: number }
  /** Scale factor to convert tick values to scaled space */
  scaleFactor: number
  /** Token color for gradient */
  tokenColor: string
  /** Total height of the chart area */
  height: number
}

/**
 * DOM-based concentration band overlay with dashed borders and gradient fill.
 * Spans the full width of the combined chart, positioned absolutely.
 */
export function ConcentrationBandOverlay({
  concentration,
  priceRange,
  scaleFactor,
  tokenColor,
  height,
}: ConcentrationBandOverlayProps): JSX.Element | null {
  const bandStyle = useMemo(() => {
    if (!concentration) {
      return null
    }

    const { min, max } = priceRange
    if (max === min) {
      return null
    }

    const startScaled = concentration.startTick * scaleFactor
    const endScaled = concentration.endTick * scaleFactor

    // Price increases upward, Y increases downward
    const topY = height - ((endScaled - min) / (max - min)) * height
    const bottomY = height - ((startScaled - min) / (max - min)) * height

    // Clamp to visible area
    const clampedTop = Math.max(0, topY)
    const clampedBottom = Math.min(height, bottomY)
    const bandHeight = clampedBottom - clampedTop

    if (bandHeight <= 0) {
      return null
    }

    return {
      top: clampedTop,
      height: bandHeight,
    }
  }, [concentration, priceRange, scaleFactor, height])

  if (!bandStyle) {
    return null
  }

  return (
    <Flex
      position="absolute"
      left={0}
      right={0}
      style={{
        top: bandStyle.top,
        height: bandStyle.height,
      }}
      pointerEvents="none"
      borderTopWidth={2}
      borderBottomWidth={2}
      borderLeftWidth={0}
      borderRightWidth={0}
      borderColor={tokenColor || '$neutral2'}
      borderStyle="dashed"
    />
  )
}

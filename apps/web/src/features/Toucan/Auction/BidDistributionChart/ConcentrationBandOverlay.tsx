import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import type { ProcessedChartData } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import { TooltipContainer } from '~/features/Toucan/Shared/TooltipContainer'

/** Transparent hit area (px) centered on each 1px line so the thin lines are easy to hover */
const LINE_HIT_AREA = 8
/** Sit above the lightweight-charts canvases (z-index 1–2) so line hovers register and the label isn't buried */
const OVERLAY_Z_INDEX = 3
/** Gap (px) between the hovered line and the label anchored to it */
const LABEL_LINE_GAP = 4

interface ConcentrationBandOverlayProps {
  /** Concentration band from processed chart data */
  concentration: ProcessedChartData['concentration']
  /** Visible price range from clearing price chart Y-axis (in scaled space) */
  priceRange: { min: number; max: number }
  /** Scale factor to convert tick values to scaled space */
  scaleFactor: number
  /** Total height of the chart area */
  height: number
  /** Whether to show the concentration band (controlled by bid input focus) */
  isVisible?: boolean
  /** Left offset for the hover label so it clears the y-axis price labels */
  labelLeftOffset?: number
  /** Bid token symbol shown alongside the concentration price range in the hover label */
  bidTokenSymbol?: string
}

/**
 * DOM-based concentration band overlay: two thin grey dashed lines marking the top
 * and bottom of the bid concentration range, spanning the full chart width. Hovering
 * either line reveals a label on the left indicating what the band marks.
 */
export function ConcentrationBandOverlay({
  concentration,
  priceRange,
  scaleFactor,
  height,
  isVisible = true,
  labelLeftOffset = 0,
  bidTokenSymbol,
}: ConcentrationBandOverlayProps): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [hoveredLine, setHoveredLine] = useState<'top' | 'bottom' | null>(null)

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
      startTick: concentration.startTick,
      endTick: concentration.endTick,
    }
  }, [concentration, priceRange, scaleFactor, height])

  if (!bandStyle || !isVisible) {
    return null
  }

  const lineStyle = { borderTop: `1px dashed ${colors.neutral3.val}` }

  return (
    <>
      {/* Top dashed line with a transparent hover hit area */}
      <Flex
        position="absolute"
        left={0}
        right={0}
        height={LINE_HIT_AREA}
        justifyContent="center"
        zIndex={OVERLAY_Z_INDEX}
        style={{ top: bandStyle.top - LINE_HIT_AREA / 2 }}
        onMouseEnter={() => setHoveredLine('top')}
        onMouseLeave={() => setHoveredLine(null)}
      >
        <Flex height={0} style={lineStyle} />
      </Flex>

      {/* Bottom dashed line with a transparent hover hit area */}
      <Flex
        position="absolute"
        left={0}
        right={0}
        height={LINE_HIT_AREA}
        justifyContent="center"
        zIndex={OVERLAY_Z_INDEX}
        style={{ top: bandStyle.top + bandStyle.height - LINE_HIT_AREA / 2 }}
        onMouseEnter={() => setHoveredLine('bottom')}
        onMouseLeave={() => setHoveredLine(null)}
      >
        <Flex height={0} style={lineStyle} />
      </Flex>

      {/* Label anchored to the hovered line: 4px below the top line or 4px above the bottom line */}
      {hoveredLine && (
        <TooltipContainer
          py="$spacing4"
          px="$spacing6"
          gap="$spacing2"
          zIndex={OVERLAY_Z_INDEX}
          style={{
            left: labelLeftOffset,
            top:
              hoveredLine === 'top'
                ? bandStyle.top + LABEL_LINE_GAP
                : bandStyle.top + bandStyle.height - LABEL_LINE_GAP,
            transform: hoveredLine === 'top' ? undefined : 'translateY(-100%)',
            whiteSpace: 'nowrap',
          }}
        >
          <Text variant="body4" color="$neutral2">
            {t('toucan.bidDistribution.legend.bidConcentration')}:
          </Text>
          <Flex row alignItems="center" gap="$spacing4">
            <SubscriptZeroPrice
              value={bandStyle.startTick}
              symbol={bidTokenSymbol}
              variant="body4"
              color="$neutral1"
              minSignificantDigits={2}
              maxSignificantDigits={2}
            />
            <Text variant="body4" color="$neutral3">
              –
            </Text>
            <SubscriptZeroPrice
              value={bandStyle.endTick}
              symbol={bidTokenSymbol}
              variant="body4"
              color="$neutral1"
              minSignificantDigits={2}
              maxSignificantDigits={2}
            />
          </Flex>
        </TooltipContainer>
      )}
    </>
  )
}

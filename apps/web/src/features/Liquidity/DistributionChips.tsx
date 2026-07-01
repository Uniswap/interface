import { mix } from 'polished'
import { useMemo } from 'react'
import { Flex, Text, useSporeColors } from 'ui/src'

export const DISTRIBUTION_CHART_WIDTH = 160

const DEFAULT_CHIP_COUNT = 40
const CHIP_WIDTH = 2
const CHIP_HEIGHT = 8
const MARKER_WIDTH = 15
const MARKER_HEIGHT = 16
const MARKER_OVERLAP = 6

interface DistributionChipsProps {
  token0Color: string
  token1Color: string
  chipCount?: number
  markerPosition?: number
}

export function DistributionChips({
  token0Color,
  token1Color,
  chipCount = DEFAULT_CHIP_COUNT,
  markerPosition,
}: DistributionChipsProps): JSX.Element {
  const colors = useSporeColors()
  const chipColors = useMemo(
    () =>
      Array.from({ length: chipCount }, (_, index) => {
        const ratio = chipCount === 1 ? 0 : index / (chipCount - 1)
        try {
          return mix(1 - ratio, token0Color, token1Color)
        } catch {
          return ratio < 0.5 ? token0Color : token1Color
        }
      }),
    [token0Color, token1Color, chipCount],
  )

  const hasMarker = markerPosition !== undefined
  const clampedPosition = hasMarker ? Math.min(Math.max(markerPosition, 0), 1) : 0
  const isFullToken0 = clampedPosition >= 1
  const isFullToken1 = clampedPosition <= 0
  const isEdge = hasMarker && (isFullToken0 || isFullToken1)
  const markerRotation = isFullToken0 ? -90 : isFullToken1 ? 90 : 0

  return (
    <Flex width="100%" position="relative" pt={hasMarker ? MARKER_HEIGHT - MARKER_OVERLAP : undefined}>
      {hasMarker && (
        <Text
          position="absolute"
          top={0}
          left={`${clampedPosition * 100}%`}
          width={MARKER_WIDTH}
          height={MARKER_HEIGHT}
          ml={-MARKER_WIDTH / 2}
          zIndex={1}
          color="$surface1"
          $group-item-hover={{ color: '$surface2' }}
        >
          <svg width={MARKER_WIDTH} height={MARKER_HEIGHT} viewBox="0 0 10 11" fill="none">
            <path
              d="M2.6875 7.85449C3.33642 9.58471 5.78468 9.58471 6.43359 7.85449L7.99024 3.70215C8.48047 2.39468 7.51357 1 6.11719 1L3.00391 1C1.60753 1 0.64063 2.39468 1.13086 3.70215L2.6875 7.85449Z"
              fill={isEdge ? colors.neutral2.val : colors.neutral1.val}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              transform={markerRotation ? `rotate(${markerRotation} 5 5.5)` : undefined}
            />
          </svg>
        </Text>
      )}
      <Flex row width="100%" justifyContent="space-between" alignItems="center">
        {chipColors.map((color, index) => (
          <Flex
            key={`distribution-chip-${index}`}
            width={CHIP_WIDTH}
            height={CHIP_HEIGHT}
            borderRadius="$roundedFull"
            backgroundColor={color}
          />
        ))}
      </Flex>
    </Flex>
  )
}

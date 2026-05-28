import { Flex } from 'ui/src'
import type { AdjustedChartItem } from '~/components/PercentageAllocationChart/types'

function getBarSegmentVisual({
  itemId,
  segmentColor,
  hoveredItemId,
  colorSegments,
}: {
  itemId: string
  segmentColor: string
  hoveredItemId: string | null
  colorSegments: boolean
}): { backgroundColor: string; opacity: number } {
  if (colorSegments) {
    if (hoveredItemId === null || hoveredItemId === itemId) {
      return { backgroundColor: segmentColor, opacity: 1 }
    }
    return { backgroundColor: segmentColor, opacity: 0.3 }
  }
  return {
    backgroundColor: hoveredItemId === itemId ? segmentColor : '$surface3',
    opacity: 1,
  }
}

interface PercentageBarsProps {
  adjustedItems: AdjustedChartItem[]
  hoveredItemId: string | null
  onHover: (id: string | null) => void
  minBarWidth: number
  className?: string
  colorSegments?: boolean
}

export function PercentageBars({
  adjustedItems,
  hoveredItemId,
  onHover,
  minBarWidth,
  className,
  colorSegments = false,
}: PercentageBarsProps): JSX.Element {
  return (
    <Flex position="relative" width="100%" className={className}>
      <Flex p="$spacing4" height="$spacing16" borderRadius="$roundedFull" backgroundColor="$surface2">
        <Flex row height="100%" gap="$spacing4" borderRadius="$roundedFull" overflow="hidden">
          {adjustedItems.map((item) => {
            const { backgroundColor, opacity } = getBarSegmentVisual({
              itemId: item.id,
              segmentColor: item.color,
              hoveredItemId,
              colorSegments,
            })
            return (
              <Flex
                key={item.id}
                height="100%"
                borderRadius="$roundedFull"
                transition="background-color 0.2s ease-in-out, opacity 0.2s ease-in-out"
                backgroundColor={backgroundColor}
                {...item.style}
                opacity={opacity}
                minWidth={minBarWidth}
                onMouseEnter={() => onHover(item.id)}
                onMouseLeave={() => onHover(null)}
              />
            )
          })}
        </Flex>
      </Flex>
    </Flex>
  )
}

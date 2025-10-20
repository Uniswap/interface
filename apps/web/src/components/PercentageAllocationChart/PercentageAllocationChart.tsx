import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Text } from 'ui/src/components/text'
import useResizeObserver from 'use-resize-observer'

export interface PercentageAllocationItem {
  id: string
  percentage: number
  color: string
  label: string
  icon?: React.ReactNode
}

interface PercentageAllocationChartProps {
  items: PercentageAllocationItem[]
  minBarWidth?: number
  maxLegendItems?: number
  className?: string
}

const MIN_BAR_WIDTH = 8
const GAP_WIDTH = 4
const MAX_SMALL_ITEMS = 4
const DEFAULT_MAX_LEGEND_ITEMS = 5

// the minimum percentage needed to meet the minimum bar width
// items below this percentage threshold will be a fixed width equal to the minimum bar width
function computeMinAutoPercentage({
  items,
  chartWidth,
  minBarWidth,
}: {
  items: PercentageAllocationItem[]
  chartWidth: number
  minBarWidth: number
}): number {
  // Calculate gap compensation - each item except the last has a 4px gap
  const totalGaps = Math.max(0, items.length - 1) * GAP_WIDTH
  const availableWidth = chartWidth - totalGaps

  // Recalculate min width percentage based on available width
  return availableWidth > 0 ? (minBarWidth / availableWidth) * 100 : 2
}

function separateSmallItems(
  items: PercentageAllocationItem[],
  minWidthPercentage: number,
): {
  itemsWithNormalWidth: PercentageAllocationItem[]
  itemsNeedingMinWidth: PercentageAllocationItem[]
} {
  return items.reduce(
    (acc, item) => {
      if (item.percentage > minWidthPercentage) {
        acc.itemsWithNormalWidth.push(item)
      } else {
        acc.itemsNeedingMinWidth.push(item)
      }
      return acc
    },
    { itemsWithNormalWidth: [], itemsNeedingMinWidth: [] } as {
      itemsWithNormalWidth: PercentageAllocationItem[]
      itemsNeedingMinWidth: PercentageAllocationItem[]
    },
  )
}

// if there are more than 4 items that need the minimum width, group the rest into an "Others" category
function groupOthers({
  items,
  minWidthPercentage,
}: {
  items: PercentageAllocationItem[]
  minWidthPercentage: number
}): PercentageAllocationItem[] {
  const { itemsWithNormalWidth, itemsNeedingMinWidth } = separateSmallItems(items, minWidthPercentage)

  if (itemsNeedingMinWidth.length <= MAX_SMALL_ITEMS) {
    return items
  } else {
    const visibleSmallItems = itemsNeedingMinWidth.slice(0, MAX_SMALL_ITEMS)
    const groupedSmallItems = itemsNeedingMinWidth.slice(MAX_SMALL_ITEMS)
    const othersPercentage = groupedSmallItems.reduce((sum, item) => sum + item.percentage, 0)

    return [
      ...itemsWithNormalWidth,
      ...visibleSmallItems,
      {
        id: 'others',
        percentage: othersPercentage,
        color: '$neutral1',
        label: 'Others',
      },
    ]
  }
}

// adjust the widths of the items to allow for the small fixed-width bar items
function adjustItemWidths({
  items,
  chartWidth,
  minBarWidth,
}: {
  items: PercentageAllocationItem[]
  chartWidth: number | undefined
  minBarWidth: number
}) {
  if (items.length === 0) {
    return []
  }
  if (!chartWidth) {
    // if the chart width is not available, fallback to basic percentage widths
    return items.map((item) => {
      return {
        ...item,
        style: {
          width: `${item.percentage}%`,
          flexShrink: 1,
        },
      }
    })
  }

  // Sort by percentage (highest first)
  const sortedItems = items.sort((a, b) => b.percentage - a.percentage)

  const minWidthPercentage = computeMinAutoPercentage({ items: sortedItems, chartWidth, minBarWidth })
  const groupedItems = groupOthers({ items: sortedItems, minWidthPercentage })
  const newMinWidthPercentage = computeMinAutoPercentage({
    items: groupedItems,
    chartWidth,
    minBarWidth,
  })
  // Identify items that need minimum width
  const { itemsWithNormalWidth, itemsNeedingMinWidth } = separateSmallItems(groupedItems, newMinWidthPercentage)

  // Calculate total percentage used by minimum width items
  const minWidthTotalPercentage = itemsNeedingMinWidth.length * newMinWidthPercentage

  // Calculate remaining percentage for normal width items
  const remainingPercentage = 100 - minWidthTotalPercentage

  // Calculate total original percentage of normal width items
  const normalItemsTotalPercentage = itemsWithNormalWidth.reduce((sum, item) => sum + item.percentage, 0)

  // Create adjusted items with calculated widths
  return groupedItems.map((item) => {
    const needsMinWidth = item.percentage <= newMinWidthPercentage

    if (needsMinWidth) {
      return {
        ...item,
        style: {
          width: '8px',
          flexShrink: 0,
        },
      }
    } else {
      // Calculate proportional width based on remaining space
      const proportionalWidth = (item.percentage / normalItemsTotalPercentage) * remainingPercentage
      return {
        ...item,
        style: {
          width: `${proportionalWidth}%`,
          flexShrink: 1,
        },
      }
    }
  })
}

export function PercentageAllocationChart({
  items,
  minBarWidth = MIN_BAR_WIDTH,
  maxLegendItems = DEFAULT_MAX_LEGEND_ITEMS,
  className,
}: PercentageAllocationChartProps): JSX.Element {
  const { t } = useTranslation()
  const { ref: chartRef, width: chartWidth } = useResizeObserver<HTMLElement>()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [showAllItems, setShowAllItems] = useState(false)

  // Calculate adjusted widths for all items
  const adjustedItems = useMemo(() => {
    return adjustItemWidths({ items, chartWidth, minBarWidth })
  }, [items, chartWidth, minBarWidth])

  const handleItemHover = (itemId: string | null) => {
    setHoveredItem(itemId)
  }

  const displayItems = showAllItems ? adjustedItems : adjustedItems.slice(0, maxLegendItems)
  const hasMoreItems = items.length > maxLegendItems

  return (
    <Flex flexDirection="column" gap="$spacing16" ref={chartRef} className={className}>
      {/* Stacked Bar with Gaps */}
      <Flex position="relative" width="100%">
        {/* Visual Bar */}
        <Flex p="$spacing4" height="$spacing16" borderRadius="$roundedFull" backgroundColor="$surface2">
          <Flex row height="100%" gap="$spacing4" borderRadius="$roundedFull" overflow="hidden">
            {adjustedItems.map((item) => {
              const isHovered = hoveredItem === item.id

              return (
                <Flex
                  key={item.id}
                  height="100%"
                  borderRadius="$roundedFull"
                  transition="all 0.2s ease-in-out"
                  backgroundColor={isHovered ? item.color : '$surface3'}
                  {...item.style}
                  minWidth={minBarWidth}
                  onHoverIn={() => setHoveredItem(item.id)}
                  onHoverOut={() => setHoveredItem(null)}
                />
              )
            })}
          </Flex>
        </Flex>
      </Flex>

      {/* Legend */}
      <Flex row alignItems="center" flexWrap="wrap" gap="$spacing24" rowGap="$spacing16">
        {displayItems.map((item) => {
          const isSelected = hoveredItem === item.id
          const shouldFade = hoveredItem !== null && !isSelected

          return (
            <Flex
              key={item.id}
              row
              alignItems="center"
              gap="$spacing8"
              transition="opacity 0.2s ease-in-out"
              cursor="pointer"
              opacity={shouldFade ? 0.3 : 1}
              onMouseEnter={() => handleItemHover(item.id)}
              onMouseLeave={() => handleItemHover(null)}
            >
              <Flex
                width="$spacing12"
                height="$spacing12"
                borderRadius="$roundedFull"
                flexShrink={0}
                backgroundColor={item.color}
              />
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
                  {item.label}
                </Text>
                {item.icon}
              </Flex>
              <Text variant="body4" color="$neutral2">
                {item.percentage.toFixed(1)}%
              </Text>
            </Flex>
          )
        })}

        {/* More/Less Toggle */}
        {hasMoreItems && (
          <Flex
            row
            alignItems="center"
            gap="$spacing4"
            cursor="pointer"
            onPress={() => setShowAllItems(!showAllItems)}
            hoverStyle={{ opacity: 0.8 }}
          >
            <Text variant="body3" color="$neutral2">
              {showAllItems ? t('common.less') : `+${items.length - maxLegendItems} ${t('common.more').toLowerCase()}`}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

import { TFunction } from 'i18next'
import type { AdjustedChartItem, PercentageAllocationItem } from '~/components/PercentageAllocationChart/types'

const GAP_WIDTH = 4
const MAX_SMALL_ITEMS = 4

/** Default minimum bar width (px); used by adjustItemWidths and bar components. Override via options/props when needed. */
export const MIN_BAR_WIDTH = 8

/** Aggregated "rest of chains" segments — always rendered last in the bar (e.g. explore volume popover). */
function isTrailingAggregateOther(item: PercentageAllocationItem): boolean {
  return item.id === 'other' || item.id === 'others'
}

/** Sort by share descending, but keep aggregate "other(s)" last regardless of size. */
function sortItemsForAllocationBar(items: PercentageAllocationItem[]): PercentageAllocationItem[] {
  return [...items].sort((a, b) => {
    const aOther = isTrailingAggregateOther(a)
    const bOther = isTrailingAggregateOther(b)
    if (aOther !== bOther) {
      return aOther ? 1 : -1
    }
    return b.percentage - a.percentage
  })
}

function computeMinAutoPercentage({
  items,
  chartWidth,
  minBarWidth,
}: {
  items: PercentageAllocationItem[]
  chartWidth: number
  minBarWidth: number
}): number {
  const totalGaps = Math.max(0, items.length - 1) * GAP_WIDTH
  const availableWidth = chartWidth - totalGaps
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

function groupOthers({
  t,
  items,
  minWidthPercentage,
}: {
  t: TFunction
  items: PercentageAllocationItem[]
  minWidthPercentage: number
}): PercentageAllocationItem[] {
  const { itemsWithNormalWidth, itemsNeedingMinWidth } = separateSmallItems(items, minWidthPercentage)

  if (itemsNeedingMinWidth.length <= MAX_SMALL_ITEMS) {
    return items
  }
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
      label: t('common.others'),
    },
  ]
}

/**
 * Adjust segment widths for the allocation bar (min width for small segments, proportional for the rest).
 */
export function adjustItemWidths({
  t,
  items,
  chartWidth,
  minBarWidth = MIN_BAR_WIDTH,
}: {
  t: TFunction
  items: PercentageAllocationItem[]
  chartWidth: number | undefined
  minBarWidth?: number
}): AdjustedChartItem[] {
  if (items.length === 0) {
    return []
  }
  if (!chartWidth) {
    return items.map((item) => ({
      ...item,
      style: {
        width: `${item.percentage}%`,
        flexShrink: 1,
      },
    }))
  }

  const sortedItems = sortItemsForAllocationBar(items)
  const minWidthPercentage = computeMinAutoPercentage({ items: sortedItems, chartWidth, minBarWidth })
  const groupedItems = groupOthers({ t, items: sortedItems, minWidthPercentage })
  const newMinWidthPercentage = computeMinAutoPercentage({
    items: groupedItems,
    chartWidth,
    minBarWidth,
  })
  const { itemsWithNormalWidth, itemsNeedingMinWidth } = separateSmallItems(groupedItems, newMinWidthPercentage)

  const minWidthTotalPercentage = itemsNeedingMinWidth.length * newMinWidthPercentage
  const remainingPercentage = 100 - minWidthTotalPercentage
  const normalItemsTotalPercentage = itemsWithNormalWidth.reduce((sum, item) => sum + item.percentage, 0)

  return groupedItems.map((item) => {
    const needsMinWidth = item.percentage <= newMinWidthPercentage

    if (needsMinWidth) {
      return {
        ...item,
        style: {
          width: `${minBarWidth}px`,
          flexShrink: 0,
        },
      }
    }
    const proportionalWidth = (item.percentage / normalItemsTotalPercentage) * remainingPercentage
    return {
      ...item,
      style: {
        width: `${proportionalWidth}%`,
        flexShrink: 1,
      },
    }
  })
}

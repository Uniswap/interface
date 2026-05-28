import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import useResizeObserver from 'use-resize-observer'
import { adjustItemWidths, MIN_BAR_WIDTH } from '~/components/PercentageAllocationChart/chartUtils'
import { Legend } from '~/components/PercentageAllocationChart/Legend'
import { PercentageBars } from '~/components/PercentageAllocationChart/PercentageBars'
import type { PercentageAllocationItem } from '~/components/PercentageAllocationChart/types'
import { useChartHover } from '~/components/PercentageAllocationChart/useChartHover'

export type { PercentageAllocationItem } from '~/components/PercentageAllocationChart/types'

const DEFAULT_MAX_LEGEND_ITEMS = 5

interface PercentageAllocationChartProps {
  items: PercentageAllocationItem[]
  minBarWidth?: number
  maxLegendItems?: number
  className?: string
}

export function PercentageAllocationChart({
  items,
  minBarWidth = MIN_BAR_WIDTH,
  maxLegendItems = DEFAULT_MAX_LEGEND_ITEMS,
  className,
}: PercentageAllocationChartProps): JSX.Element {
  const { t } = useTranslation()
  const { ref: chartRef, width: chartWidth } = useResizeObserver<HTMLElement>()
  const { hoveredItemId, onHover } = useChartHover()
  const [showAllItems, setShowAllItems] = useState(false)

  const adjustedItems = useMemo(
    () => adjustItemWidths({ t, items, chartWidth, minBarWidth }),
    [t, items, chartWidth, minBarWidth],
  )

  const displayItems = showAllItems ? adjustedItems : adjustedItems.slice(0, maxLegendItems)
  const hasMoreItems = adjustedItems.length > maxLegendItems

  return (
    <Flex flexDirection="column" gap="$spacing16" ref={chartRef} className={className}>
      <PercentageBars
        adjustedItems={adjustedItems}
        hoveredItemId={hoveredItemId}
        onHover={onHover}
        minBarWidth={minBarWidth}
      />
      <Legend
        items={displayItems}
        hoveredItemId={hoveredItemId}
        onItemHover={onHover}
        hasMoreItems={hasMoreItems}
        showAllItems={showAllItems}
        onShowAllToggle={() => setShowAllItems((prev) => !prev)}
        totalItemsCount={adjustedItems.length}
        maxLegendItems={maxLegendItems}
      />
    </Flex>
  )
}

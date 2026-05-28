import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea } from 'ui/src'
import { Text } from 'ui/src/components/text'
import type { AdjustedChartItem } from '~/components/PercentageAllocationChart/types'

interface LegendProps {
  items: AdjustedChartItem[]
  hoveredItemId: string | null
  onItemHover: (id: string | null) => void
  hasMoreItems: boolean
  showAllItems: boolean
  onShowAllToggle: () => void
  totalItemsCount: number
  maxLegendItems: number
}

export function Legend({
  items,
  hoveredItemId,
  onItemHover,
  hasMoreItems,
  showAllItems,
  onShowAllToggle,
  totalItemsCount,
  maxLegendItems,
}: LegendProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" flexWrap="wrap" gap="$spacing24" rowGap="$spacing16">
      {items.map((item) => {
        const isSelected = hoveredItemId === item.id
        const shouldFade = hoveredItemId !== null && !isSelected

        return (
          <Flex
            key={item.id}
            row
            alignItems="center"
            gap="$spacing8"
            transition="opacity 0.2s ease-in-out"
            cursor="pointer"
            opacity={shouldFade ? 0.3 : 1}
            onMouseEnter={() => onItemHover(item.id)}
            onMouseLeave={() => onItemHover(null)}
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

      {hasMoreItems && (
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing4"
          cursor="pointer"
          onPress={onShowAllToggle}
          hoverStyle={{ opacity: 0.8 }}
        >
          <Text variant="body3" color="$neutral2">
            {showAllItems ? t('common.less') : `+${totalItemsCount - maxLegendItems} ${t('common.more').toLowerCase()}`}
          </Text>
        </TouchableArea>
      )}
    </Flex>
  )
}

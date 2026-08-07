import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { OrderDirection } from '~/data/util'
import { scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { ExpandableAssetMetricHeaderTooltip } from '~/pages/Explore/rwa/table/ExpandableAssetMetricHeaderTooltip'
import { getStocksSortMethodLabel } from '~/pages/Explore/rwa/table/stocksSortMethodLabels'
import { StocksSortMethod, useStocksTableSortStoreActions } from '~/pages/Explore/rwa/table/stocksTableSortStore'

export function StocksTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: StocksSortMethod
  isCurrentSortMethod: boolean
  direction: OrderDirection
}): JSX.Element {
  const { t } = useTranslation()
  const headerText = useMemo(() => getStocksSortMethodLabel({ t, category }), [t, category])
  const { setSort } = useStocksTableSortStoreActions()
  const handleSortCategory = useCallback(() => {
    setSort(category)
    scrollToExploreTokenSection()
  }, [setSort, category])

  return (
    <ClickableHeaderRow onPress={handleSortCategory} width="100%" group>
      <ExpandableAssetMetricHeaderTooltip category={category} onTooltipClick={handleSortCategory}>
        <Flex row gap="$gap4" alignItems="center" cursor="pointer">
          {isCurrentSortMethod && <HeaderArrow orderDirection={direction} size="$icon.16" />}
          <HeaderSortText active={isCurrentSortMethod} variant="body3">
            {headerText}
          </HeaderSortText>
        </Flex>
      </ExpandableAssetMetricHeaderTooltip>
    </ClickableHeaderRow>
  )
}

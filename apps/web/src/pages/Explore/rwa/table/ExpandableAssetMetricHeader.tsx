import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import type { OrderDirection } from '~/appGraphql/data/util'
import { HeaderCell } from '~/components/Table/styled'
import { ExpandableAssetMetricHeaderTooltip } from '~/pages/Explore/rwa/table/ExpandableAssetMetricHeaderTooltip'
import { getStocksSortMethodLabel } from '~/pages/Explore/rwa/table/stocksSortMethodLabels'
import { StocksTableHeader } from '~/pages/Explore/rwa/table/StocksTableHeader'
import type { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

export function ExpandableAssetMetricHeader({
  enableSorting,
  sortMethod,
  activeSortMethod,
  orderDirection,
  justifyContent = 'flex-end',
  omitSortableJustify = false,
}: {
  enableSorting: boolean
  /** Sort column this header represents. */
  sortMethod: StocksSortMethod
  /** Currently active sort column; required when enableSorting is true. */
  activeSortMethod?: StocksSortMethod
  orderDirection?: OrderDirection
  justifyContent?: 'flex-end' | 'flex-start'
  /** Volume sort header omits justifyContent to match Tokens table layout. */
  omitSortableJustify?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  if (!enableSorting) {
    return (
      <HeaderCell justifyContent={justifyContent}>
        <ExpandableAssetMetricHeaderTooltip category={sortMethod}>
          <Text variant="body3" color="$neutral2" fontWeight="500">
            {getStocksSortMethodLabel({ t, category: sortMethod })}
          </Text>
        </ExpandableAssetMetricHeaderTooltip>
      </HeaderCell>
    )
  }

  return (
    <HeaderCell clickable {...(!omitSortableJustify ? { justifyContent } : {})}>
      <StocksTableHeader
        category={sortMethod}
        isCurrentSortMethod={activeSortMethod === sortMethod}
        direction={orderDirection!}
      />
    </HeaderCell>
  )
}

import type { TFunction } from 'i18next'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { OrderDirection } from '~/appGraphql/data/util'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import {
  PortfolioTokenSortMethod,
  usePortfolioTokenTableSortStoreActions,
} from '~/pages/Portfolio/Tokens/Table/portfolioTokenTableSortStore'

export function getPortfolioTokenColumnHeaderLabel(t: TFunction, category: PortfolioTokenSortMethod): string {
  const SORT_METHOD_LABEL_KEYS: Record<PortfolioTokenSortMethod, string> = {
    [PortfolioTokenSortMethod.VALUE]: t('portfolio.tokens.table.column.value'),
    [PortfolioTokenSortMethod.PRICE]: t('portfolio.tokens.table.column.price'),
    [PortfolioTokenSortMethod.CHANGE_1D]: t('portfolio.tokens.table.column.change1d'),
    [PortfolioTokenSortMethod.BALANCE]: t('portfolio.tokens.table.column.balance'),
    [PortfolioTokenSortMethod.ALLOCATION]: t('portfolio.tokens.table.column.allocation'),
    [PortfolioTokenSortMethod.AVG_COST]: t('portfolio.tokens.table.column.avgCost'),
    [PortfolioTokenSortMethod.UNREALIZED_PNL]: t('portfolio.tokens.table.column.unrealizedPnl'),
  }
  return SORT_METHOD_LABEL_KEYS[category]
}

export function PortfolioTokenTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: PortfolioTokenSortMethod
  isCurrentSortMethod: boolean
  direction: OrderDirection
}) {
  const { t } = useTranslation()
  const headerText = useMemo(() => getPortfolioTokenColumnHeaderLabel(t, category), [t, category])
  const { setSort } = usePortfolioTokenTableSortStoreActions()
  const handleSortCategory = useCallback(() => setSort(category), [setSort, category])

  return (
    <ClickableHeaderRow onPress={handleSortCategory} group>
      <Flex row gap="$gap4" alignItems="center">
        {isCurrentSortMethod && <HeaderArrow orderDirection={direction} size="$icon.16" />}
        <HeaderSortText active={isCurrentSortMethod} variant="body3">
          {headerText}
        </HeaderSortText>
      </Flex>
    </ClickableHeaderRow>
  )
}

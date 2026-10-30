import { Flex } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { memo, useMemo } from 'react'
import type { TokenCategoryDefaultSort } from 'uniswap/src/features/tokenCategories/types'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { TokenTable } from '~/pages/Explore/tables/Tokens/TokensTable'
import {
  getTokenTableSort,
  TokenTableSortStoreContextProvider,
  useTokenTableSortStore,
} from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

// Legacy `m: '0 auto'` expanded to per-side `margin-top: 0 auto` etc. — invalid CSS the browser
// drops — so no margin ever rendered; only the max-width (MAX_WIDTH_MEDIA_BREAKPOINT) carries over.
const TableWrapper = styled(Flex, {
  base: 'max-w-[1200px]',
})

interface TopTokensTableProps {
  categoryId?: string
  /** Show an empty or failed result as loading, for a host about to replace this table. */
  holdEmptyResult?: boolean
  defaultSort?: TokenCategoryDefaultSort
}

function TopTokensTableContent({ categoryId, holdEmptyResult = false }: TopTokensTableProps): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const sortMethod = useTokenTableSortStore((s) => s.sortMethod)
  const sortAscending = useTokenTableSortStore((s) => s.sortAscending)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const timePeriod = useExploreTablesFilterStore((s) => s.timePeriod)

  const options = useMemo(
    () => ({ sortMethod, sortAscending, filterString, filterTimePeriod: timePeriod, categoryId }),
    [sortMethod, sortAscending, filterString, timePeriod, categoryId],
  )

  const { topTokens, tokenSortRank, isLoading, sparklines, isError, loadMore } = useListTokens(chainId, options)

  const heldResult = holdEmptyResult && (isError || topTokens.length === 0)

  return (
    <TableWrapper testID="top-tokens-explore-table">
      <TokenTable
        tokens={topTokens}
        tokenSortRank={tokenSortRank}
        sparklines={sparklines}
        loading={isLoading || heldResult}
        loadMore={loadMore}
        error={isError && !heldResult}
        categoryId={categoryId}
      />
    </TableWrapper>
  )
}

export const TopTokensTable = memo(function TopTokensTable({ defaultSort, ...props }: TopTokensTableProps) {
  const initialSort = getTokenTableSort(defaultSort)
  return (
    <TokenTableSortStoreContextProvider
      key={`${props.categoryId}:${initialSort.sortMethod}:${initialSort.sortAscending}`}
      initialSort={initialSort}
    >
      <TopTokensTableContent {...props} />
    </TokenTableSortStoreContextProvider>
  )
})

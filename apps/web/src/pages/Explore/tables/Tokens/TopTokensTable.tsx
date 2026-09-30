import { Flex } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { memo, useMemo } from 'react'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { TokenTable } from '~/pages/Explore/tables/Tokens/TokensTable'
import {
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
  /** Category came from the URL and isn't confirmed yet; terminal states are held as loading. */
  categoryUnverified?: boolean
}

function TopTokensTableContent({ categoryId, categoryUnverified = false }: TopTokensTableProps): JSX.Element {
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

  // An unverified category may be a bogus slug the BE rejects or empties; keep the skeleton up until
  // ListCategories settles it, since a fallback to All is about to replace this table anyway.
  const holdUnverifiedResult = categoryUnverified && (isError || topTokens.length === 0)

  return (
    <TableWrapper testID="top-tokens-explore-table">
      <TokenTable
        tokens={topTokens}
        tokenSortRank={tokenSortRank}
        sparklines={sparklines}
        loading={isLoading || holdUnverifiedResult}
        loadMore={loadMore}
        error={isError && !categoryUnverified}
        categoryId={categoryId}
      />
    </TableWrapper>
  )
}

export const TopTokensTable = memo(function TopTokensTable(props: TopTokensTableProps) {
  return (
    <TokenTableSortStoreContextProvider>
      <TopTokensTableContent {...props} />
    </TokenTableSortStoreContextProvider>
  )
})

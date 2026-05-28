import { memo, useMemo } from 'react'
import { Flex, styled } from 'ui/src'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { TABLE_PAGE_SIZE } from '~/features/Explore/state'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useExploreBackendSortingEnabled } from '~/features/Explore/state/useExploreBackendSortingEnabled'
import { useSimplePagination } from '~/hooks/useSimplePagination'
import { TokenTable } from '~/pages/Explore/tables/Tokens/TokensTable'
import {
  TokenTableSortStoreContextProvider,
  useTokenTableSortStore,
} from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

function TopTokensTableContent(): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const sortMethod = useTokenTableSortStore((s) => s.sortMethod)
  const sortAscending = useTokenTableSortStore((s) => s.sortAscending)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const timePeriod = useExploreTablesFilterStore((s) => s.timePeriod)

  const options = useMemo(
    () => ({ sortMethod, sortAscending, filterString, filterTimePeriod: timePeriod }),
    [sortMethod, sortAscending, filterString, timePeriod],
  )

  const backendSortingEnabled = useExploreBackendSortingEnabled()
  const { topTokens, tokenSortRank, isLoading, sparklines, isError, loadMore } = useListTokens(chainId, options)

  const { page, loadMore: clientLoadMore } = useSimplePagination()
  const effectiveLoadMore = loadMore ?? clientLoadMore
  const displayedTokens = backendSortingEnabled ? topTokens : topTokens.slice(0, page * TABLE_PAGE_SIZE)

  return (
    <TableWrapper data-testid="top-tokens-explore-table">
      <TokenTable
        tokens={displayedTokens}
        tokenSortRank={tokenSortRank}
        sparklines={sparklines}
        loading={isLoading}
        loadMore={effectiveLoadMore}
        error={isError}
      />
    </TableWrapper>
  )
}

export const TopTokensTable = memo(function TopTokensTable() {
  return (
    <TokenTableSortStoreContextProvider>
      <TopTokensTableContent />
    </TokenTableSortStoreContextProvider>
  )
})

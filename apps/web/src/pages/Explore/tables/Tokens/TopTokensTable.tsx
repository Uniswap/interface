import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useMemo } from 'react'
import { Flex, styled } from 'ui/src'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { TABLE_PAGE_SIZE } from '~/features/Explore/state'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useSimplePagination } from '~/pages/Explore/hooks/useSimplePagination'
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

  const tokenV2EndpointsEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const { topTokens, tokenSortRank, isLoading, sparklines, isError, loadMore } = useListTokens(chainId, options)

  // Legacy path paginates already-loaded data client-side; useSimplePagination paces the reveal
  // (so the load-more indicator shows) and gates loadMore once all rows are displayed. Backend
  // sorting uses its own async loadMore, so clientLoadMore is unused there.
  const { page, loadMore: clientLoadMore } = useSimplePagination({
    totalCount: topTokens.length,
    pageSize: TABLE_PAGE_SIZE,
  })
  const effectiveLoadMore = loadMore ?? clientLoadMore
  const displayedTokens = tokenV2EndpointsEnabled ? topTokens : topTokens.slice(0, page * TABLE_PAGE_SIZE)

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

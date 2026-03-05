import { memo } from 'react'
import { Flex, styled } from 'ui/src'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import useSimplePagination from '~/hooks/useSimplePagination'
import { TokenTable } from '~/pages/Explore/tables/Tokens/TokensTable'
import {
  TokenTableSortStoreContextProvider,
  useTokenTableSortStore,
} from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { TABLE_PAGE_SIZE } from '~/state/explore'
import { useTopTokens } from '~/state/explore/topTokens/useTopTokens'
import { useChainIdFromUrlParam } from '~/utils/chainParams'

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

function TopTokensTableContent(): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const sortOptions = useTokenTableSortStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const { topTokens, tokenSortRank, isLoading, sparklines, isError, loadMore } = useTopTokens(chainId, sortOptions)

  const { page, loadMore: clientLoadMore } = useSimplePagination()
  const effectiveLoadMore = loadMore ?? clientLoadMore
  const displayedTokens = loadMore ? topTokens : topTokens?.slice(0, page * TABLE_PAGE_SIZE)

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

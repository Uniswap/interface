import { Trans } from '@lingui/macro'
import { ChainId, Token } from '@uniswap/sdk-core'
import { PoolsTable, PoolTableColumns, PoolTableSortState } from 'components/Pools/PoolTable/PoolTable'
import { OrderDirection, Pool_OrderBy } from 'graphql/thegraph/__generated__/types-and-hooks'
import { usePoolsFromTokenAddress } from 'graphql/thegraph/PoolsFromTokenAddress'
import { useCallback, useState } from 'react'
import { ThemedText } from 'theme/components'

const HIDDEN_COLUMNS = [PoolTableColumns.Transactions]

export function TokenDetailsPoolsTable({ chainId, referenceToken }: { chainId: ChainId; referenceToken: Token }) {
  const [sortState, setSortMethod] = useState<PoolTableSortState>({
    sortBy: Pool_OrderBy.TotalValueLockedUsd,
    sortDirection: OrderDirection.Desc,
  })
  const { pools, loading, error, loadMore } = usePoolsFromTokenAddress(
    referenceToken.address,
    chainId,
    sortState.sortBy,
    sortState.sortDirection
  )

  const handleHeaderClick = useCallback(
    (newSortMethod: Pool_OrderBy) => {
      if (sortState.sortBy === newSortMethod) {
        setSortMethod({
          sortBy: newSortMethod,
          sortDirection: sortState.sortDirection === OrderDirection.Asc ? OrderDirection.Desc : OrderDirection.Asc,
        })
      } else {
        setSortMethod({
          sortBy: newSortMethod,
          sortDirection: OrderDirection.Desc,
        })
      }
    },
    [sortState.sortBy, sortState.sortDirection]
  )

  if (error) {
    return (
      <ThemedText.BodyPrimary>
        <Trans>Error loading Top Pools</Trans>
      </ThemedText.BodyPrimary>
    )
  }

  return (
    <div data-testid={`tdp-pools-table-${referenceToken.address.toLowerCase()}`}>
      <PoolsTable
        pools={pools}
        loading={loading}
        chainId={chainId}
        maxHeight={600}
        hiddenColumns={HIDDEN_COLUMNS}
        loadMore={loadMore}
        sortState={sortState}
        handleHeaderClick={handleHeaderClick}
      />
    </div>
  )
}

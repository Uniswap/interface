import { Trans } from '@lingui/macro'
import { ChainId, Token } from '@uniswap/sdk-core'
import { PoolTableColumns, PoolsTable } from 'components/Pools/PoolTable/PoolTable'
import { usePoolsFromTokenAddress } from 'graphql/data/pools/usePoolsFromTokenAddress'
import { PoolSortFields, PoolTableSortState } from 'graphql/data/pools/useTopPools'
import { OrderDirection } from 'graphql/data/util'
import { useCallback, useState } from 'react'
import { ThemedText } from 'theme/components'

const HIDDEN_COLUMNS = [PoolTableColumns.Transactions]

export function TokenDetailsPoolsTable({ chainId, referenceToken }: { chainId: ChainId; referenceToken: Token }) {
  const [sortState, setSortMethod] = useState<PoolTableSortState>({
    sortBy: PoolSortFields.TVL,
    sortDirection: OrderDirection.Desc,
  })
  const { pools, loading, error, loadMore } = usePoolsFromTokenAddress(referenceToken.address, sortState, chainId)

  const handleHeaderClick = useCallback(
    (newSortMethod: PoolSortFields) => {
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

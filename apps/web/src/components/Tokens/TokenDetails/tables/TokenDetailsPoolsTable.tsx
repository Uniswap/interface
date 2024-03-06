import { ChainId, Token } from '@uniswap/sdk-core'
import { PoolTableColumns, PoolsTable, sortAscendingAtom, sortMethodAtom } from 'components/Pools/PoolTable/PoolTable'
import { usePoolsFromTokenAddress } from 'graphql/data/pools/usePoolsFromTokenAddress'
import { OrderDirection } from 'graphql/data/util'
import { useAtomValue, useResetAtom } from 'jotai/utils'
import { useEffect, useMemo } from 'react'

const HIDDEN_COLUMNS = [PoolTableColumns.Transactions]

export function TokenDetailsPoolsTable({ chainId, referenceToken }: { chainId: ChainId; referenceToken: Token }) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  const sortState = useMemo(
    () => ({ sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc }),
    [sortAscending, sortMethod]
  )
  const { pools, loading, error, loadMore } = usePoolsFromTokenAddress(referenceToken.address, sortState, chainId)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  return (
    <div data-testid={`tdp-pools-table-${referenceToken.address.toLowerCase()}`}>
      <PoolsTable
        pools={pools}
        loading={loading}
        error={error}
        chainId={chainId}
        maxHeight={600}
        hiddenColumns={HIDDEN_COLUMNS}
        loadMore={loadMore}
      />
    </div>
  )
}

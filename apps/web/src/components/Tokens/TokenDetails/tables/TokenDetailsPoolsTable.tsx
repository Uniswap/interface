import { ApolloError } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import { PoolsTable, sortAscendingAtom, sortMethodAtom } from 'components/Pools/PoolTable/PoolTable'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { usePoolsFromTokenAddress } from 'graphql/data/pools/usePoolsFromTokenAddress'
import { PoolSortFields } from 'graphql/data/pools/useTopPools'
import { OrderDirection } from 'graphql/data/util'
import { useAtomValue, useResetAtom } from 'jotai/utils'
import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const HIDDEN_COLUMNS = [PoolSortFields.VolOverTvl]

export function TokenDetailsPoolsTable({
  chainId,
  referenceToken,
}: {
  chainId: UniverseChainId
  referenceToken: Token
}) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  const sortState = useMemo(
    () => ({ sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc }),
    [sortAscending, sortMethod],
  )
  const { pools, loading, errorV2, errorV3, loadMore } = usePoolsFromTokenAddress(
    referenceToken.address,
    sortState,
    chainId,
  )
  const combinedError =
    errorV2 && errorV3
      ? new ApolloError({
          errorMessage: `Could not retrieve V2 and V3 Pools for token ${referenceToken.address} on chain: ${chainId}`,
        })
      : undefined
  const allDataStillLoading = loading && !pools.length
  useUpdateManualOutage({ chainId, errorV3, errorV2 })

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  return (
    <Flex data-testid={`tdp-pools-table-${referenceToken.address.toLowerCase()}`}>
      <PoolsTable
        pools={pools}
        loading={allDataStillLoading}
        error={combinedError}
        maxHeight={600}
        hiddenColumns={HIDDEN_COLUMNS}
        loadMore={loadMore}
      />
    </Flex>
  )
}

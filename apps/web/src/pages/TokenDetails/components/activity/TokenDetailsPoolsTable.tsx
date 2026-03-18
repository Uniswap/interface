import { ApolloError } from '@apollo/client'
import { type Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { Flex } from 'ui/src'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { usePoolsFromTokenAddress } from '~/appGraphql/data/pools/usePoolsFromTokenAddress'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { useUpdateManualOutage } from '~/hooks/useUpdateManualOutage'
import { ExploreTablesFilterStoreContextProvider } from '~/pages/Explore/exploreTablesFilterStore'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolTableStoreContextProvider, usePoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'

const HIDDEN_COLUMNS = [PoolSortFields.VolOverTvl, PoolSortFields.RewardApr]

function TokenDetailsPoolsTableContent({ referenceCurrency }: { referenceCurrency: Currency }): JSX.Element {
  const { chainId, wrapped: referenceToken, isNative } = referenceCurrency
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const sortState = useMemo(
    () => ({ sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc }),
    [sortAscending, sortMethod],
  )
  const { pools, loading, errorV2, errorV3, loadMore } = usePoolsFromTokenAddress({
    tokenAddress: referenceToken.address,
    sortState,
    chainId: referenceCurrency.chainId,
    isNative,
  })
  const combinedError =
    errorV2 && errorV3
      ? new ApolloError({
          errorMessage: `Could not retrieve V2 and V3 Pools for token ${referenceToken.address} on chain: ${chainId}`,
        })
      : undefined
  const allDataStillLoading = loading && !pools.length
  useUpdateManualOutage({ chainId, errorV3, errorV2, trigger: pools })

  return (
    <Flex data-testid={`tdp-pools-table-${normalizeAddress(referenceToken.address, AddressStringFormat.Lowercase)}`}>
      <PoolsTable
        pools={pools}
        loading={allDataStillLoading}
        error={combinedError}
        maxHeight={600}
        hiddenColumns={HIDDEN_COLUMNS}
        loadMore={loadMore}
        forcePinning
      />
    </Flex>
  )
}

export function TokenDetailsPoolsTable({ referenceCurrency }: { referenceCurrency: Currency }): JSX.Element {
  return (
    <ExploreTablesFilterStoreContextProvider>
      <PoolTableStoreContextProvider>
        <TokenDetailsPoolsTableContent referenceCurrency={referenceCurrency} />
      </PoolTableStoreContextProvider>
    </ExploreTablesFilterStoreContextProvider>
  )
}

import { usePoolsFromTokenAddress } from 'appGraphql/data/pools/usePoolsFromTokenAddress'
import { PoolSortFields } from 'appGraphql/data/pools/useTopPools'
import { OrderDirection } from 'appGraphql/data/util'
import { useUpdateManualOutage } from 'featureFlags/flags/outageBanner'
import { ApolloError } from '@apollo/client'
import { type Currency } from '@uniswap/sdk-core'
import { PoolsTable, sortAscendingAtom, sortMethodAtom } from 'components/Pools/PoolTable/PoolTable'
import { useAtomValue, useResetAtom } from 'jotai/utils'
import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'

const HIDDEN_COLUMNS = [PoolSortFields.VolOverTvl, PoolSortFields.RewardApr]

export function TokenDetailsPoolsTable({ referenceCurrency }: { referenceCurrency: Currency }) {
  const { chainId, wrapped: referenceToken, isNative } = referenceCurrency
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
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
  useUpdateManualOutage({ chainId, errorV3, errorV2 })

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)
  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

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

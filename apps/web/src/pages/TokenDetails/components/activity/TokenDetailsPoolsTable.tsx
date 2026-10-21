import { type Currency } from '@uniswap/sdk-core'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { BREAKPOINT_PX } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { PoolSortFields } from '~/data/pools/poolStats'
import { usePoolsFromTokenAddress } from '~/data/pools/usePoolsFromTokenAddress'
import { OrderDirection } from '~/data/util'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolTableStoreContextProvider, usePoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'

const HIDDEN_COLUMNS = [PoolSortFields.VolOverTvl, PoolSortFields.RewardApr]

// At and below $xxl the layout's horizontal padding is active, so the left panel
// (1200px AppBody cap − padding − column gap − swap rail) drops under the table's ~740px
// min content width — the leading columns pin and the table scrolls. Above $xxl the
// padding drops and the panel fits the table.
const PIN_COLUMNS_BELOW_WIDTH = BREAKPOINT_PX.xxl + 1

function TokenDetailsPoolsTableContent({
  referenceCurrency,
  isMultichainView,
}: {
  referenceCurrency: Currency
  isMultichainView: boolean
}): JSX.Element {
  const { chainId, wrapped: referenceToken, isNative } = referenceCurrency
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const sortState = useMemo(
    () => ({ sortBy: sortMethod, sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc }),
    [sortAscending, sortMethod],
  )
  const multiChainMap = useTDPStore((s) => s.multiChainMap)
  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const { pools, loading, isError, loadMore } = usePoolsFromTokenAddress({
    tokenAddress: referenceToken.address,
    sortState,
    chainId: referenceCurrency.chainId,
    isNative,
    multichain: isMultichainView,
    multichainEntries,
  })
  const allDataStillLoading = loading && !pools.length

  return (
    <Flex testID={`tdp-pools-table-${normalizeAddress(referenceToken.address, AddressStringFormat.Lowercase)}`}>
      <PoolsTable
        mobileFullBleed
        pools={pools}
        loading={allDataStillLoading}
        error={isError}
        maxHeight={600}
        maxWidth={PIN_COLUMNS_BELOW_WIDTH}
        hiddenColumns={HIDDEN_COLUMNS}
        loadMore={loadMore}
        // Multichain view lists pools across chains, so only scope the hook registry when it's one chain
        chainId={isMultichainView ? undefined : chainId}
        surface="tdp"
      />
    </Flex>
  )
}

export function TokenDetailsPoolsTable({
  referenceCurrency,
  isMultichainView,
}: {
  referenceCurrency: Currency
  isMultichainView: boolean
}): JSX.Element {
  return (
    <PoolTableStoreContextProvider>
      <TokenDetailsPoolsTableContent referenceCurrency={referenceCurrency} isMultichainView={isMultichainView} />
    </PoolTableStoreContextProvider>
  )
}

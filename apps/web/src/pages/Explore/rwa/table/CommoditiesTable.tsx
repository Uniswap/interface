import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useExploreRwaTokens } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaTokens'
import { noop } from 'utilities/src/react/noop'
import type { RwaChainScope } from '~/pages/Explore/rwa/table/RwaCategoryTable'
import { RwaExploreTableShell } from '~/pages/Explore/rwa/table/RwaExploreTableShell'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** Flag-off Commodities table (v1 ListRwaTokens). With token categories on, Commodities renders the standard flat table. */
export function CommoditiesTable({ chainScope }: { chainScope?: RwaChainScope } = {}): JSX.Element {
  const urlChainId = useChainIdFromUrlParam()
  const chainId = chainScope ? chainScope.chainId : urlChainId
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  const { rows, isLoading, isError } = useExploreRwaTokens({ category: RwaCategory.COMMODITIES, chainIds })

  return (
    <RwaExploreTableShell
      rows={rows}
      rowsKey={String(chainId)}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={false}
      isFetchingNextPage={false}
      fetchNextPage={noop}
    />
  )
}

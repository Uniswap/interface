import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useExploreRwaTokens } from 'uniswap/src/data/rest/rwa/useExploreRwaTokens'
import { RwaExploreTableShell } from '~/pages/Explore/rwa/table/RwaExploreTableShell'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** Commodities category table — flat issuer-token rows from ListRwaTokens. */
export function CommoditiesTable(): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  const { rows, isLoading, isError } = useExploreRwaTokens({ category: RwaCategory.COMMODITIES, chainIds })

  return <RwaExploreTableShell rows={rows} isLoading={isLoading} isError={isError} />
}

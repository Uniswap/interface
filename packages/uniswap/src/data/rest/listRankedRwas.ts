import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { listRankedRwas } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import type { ListRankedRwasResponse, RankedRwa, RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { OnchainItemListOptionType, type RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/rest/base'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * Queries the data-api ListRankedRwas endpoint for ranked RWA tokens (e.g. tokenized stocks).
 * The server scopes chainTokens to the requested chainIds, so we pass the caller's explicit
 * chainIds (e.g. the selected network filter) or fall back to the app's enabled chains.
 */
export function useListRankedRwasQuery({
  category,
  chainIds,
  includeSparkline1d,
  enabled = true,
}: {
  category: RwaCategory
  chainIds: number[]
  // Opt-in price-history sparkline; the server omits sparkline_1d at all levels when false.
  includeSparkline1d: boolean
  enabled?: boolean
}): UseQueryResult<ListRankedRwasResponse, ConnectError> {
  const { chains: enabledChainIds } = useEnabledChains()
  const resolvedChainIds = chainIds.length > 0 ? chainIds : enabledChainIds
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  return useQuery(
    listRankedRwas,
    { category, chainIds: resolvedChainIds, includeSparkline1d, useSubstreamData: isV2TokensEnabled },
    {
      transport: entryGatewayProdPostTransport,
      enabled: enabled && resolvedChainIds.length > 0,
      staleTime: 5 * ONE_MINUTE_MS,
      gcTime: 30 * ONE_MINUTE_MS,
    },
  )
}

/**
 * Builds a render-only RWA token option from the highest-liquidity issuer+chain
 * (issuerTokens[0].chainTokens[0]). No SDK Currency / decimals are constructed — the tile
 * renders from these raw fields and the swap form re-resolves token info on select.
 */
export function buildRwaTokenOption(rwa: RankedRwa): RwaTokenOption | null {
  const issuerToken = rwa.issuerTokens[0]
  const chainToken = issuerToken?.chainTokens[0]
  if (!issuerToken || !chainToken || !issuerToken.symbol || !chainToken.address) {
    return null
  }

  const chainId = toSupportedChainId(chainToken.chainId)
  if (!chainId) {
    return null
  }

  return {
    type: OnchainItemListOptionType.Rwa,
    chainId,
    address: chainToken.address,
    symbol: issuerToken.symbol,
    name: issuerToken.name,
    // proto3 logoUrl defaults to '' (not undefined), so use || (not ??) to fall back to the rwa-level logo
    logoUrl: issuerToken.logoUrl || rwa.logoUrl,
  }
}

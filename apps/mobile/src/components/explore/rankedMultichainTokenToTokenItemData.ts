import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import {
  normalizeBackendNativeAddress,
  pickPrimaryDeployment,
} from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { formatColorOverrides } from 'uniswap/src/features/dataApi/utils/formatColorOverrides'

/** Converts a v2 RankedMultichainToken (from ListTokens) into mobile's TokenItemData shape. */
export function rankedMultichainTokenToTokenItemData({
  rankedToken,
  selectedNetwork,
  enabledChainIds,
}: {
  rankedToken: RankedMultichainToken
  selectedNetwork: UniverseChainId | null
  enabledChainIds: readonly UniverseChainId[]
}): TokenItemData | null {
  const multichainToken = rankedToken.multichainToken
  if (!multichainToken) {
    return null
  }

  const deployment = pickPrimaryDeployment({
    addresses: multichainToken.addresses,
    chainId: selectedNetwork ?? undefined,
    chainStats: rankedToken.chainStats,
  })
  if (!deployment) {
    return null
  }
  const chainId = deployment.chainId as UniverseChainId

  // The grouping's addresses map is not scoped to the request's chains (it always carries every
  // deployment), so count only enabled chains — mirrors web's getAllowedAddressChainIds gating.
  const enabled = new Set<number>(enabledChainIds)
  const networkCount = Object.keys(multichainToken.addresses).filter((chainIdKey) =>
    enabled.has(Number(chainIdKey)),
  ).length

  return {
    name: multichainToken.name,
    logoUrl: multichainToken.project?.logoUrl ?? '',
    colorOverrides: formatColorOverrides(multichainToken.project?.colors),
    chainId,
    address: normalizeBackendNativeAddress({ chainId, address: deployment.address }),
    symbol: multichainToken.symbol,
    price: multichainToken.price?.spotUsd,
    // The list is server-sorted by real market cap, so show that value. Fall back to FDV rather than
    // blank where the pipeline has no circulating-supply source (e.g. Solana).
    marketCap: rankedToken.stats?.marketCap ?? rankedToken.stats?.fdv,
    pricePercentChange24h: multichainToken.price?.percentChange1d,
    volume24h: rankedToken.stats?.volume1d,
    totalValueLocked: rankedToken.stats?.tvl,
    networkCount: networkCount || undefined,
  }
}

import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { pickPrimaryDeployment } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Converts a v2 RankedMultichainToken (from ListTokens) into mobile's TokenItemData shape, the
 * v2 counterpart to tokenRankingStatsToTokenItemData in useExploreTokenItems/useV1ExploreTokenItems.ts.
 */
export function rankedMultichainTokenToTokenItemData(
  rankedToken: RankedMultichainToken,
  selectedNetwork: UniverseChainId | null,
): TokenItemData | null {
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

  return {
    name: multichainToken.name,
    logoUrl: multichainToken.project?.logoUrl ?? '',
    chainId,
    address: deployment.address === 'ETH' ? getNativeAddress(chainId) : deployment.address,
    symbol: multichainToken.symbol,
    price: multichainToken.price?.spotUsd,
    marketCap: rankedToken.stats?.fdv,
    pricePercentChange24h: multichainToken.price?.percentChange1d,
    volume24h: rankedToken.stats?.volume1d,
    totalValueLocked: rankedToken.stats?.tvl,
    networkCount: Object.keys(multichainToken.addresses).length || undefined,
  }
}

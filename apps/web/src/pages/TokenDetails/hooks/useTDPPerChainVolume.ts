import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenMarketsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { getGetTokenMarketsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { fromGraphQLChain, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useIsV2TokensEnabled } from 'uniswap/src/features/dataApi/tokenDetails/useIsV2TokensEnabled'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

/** 24h volume per chainId. Exported for tests. */
export function selectVolumeByChainId(data: PlainMessage<GetTokenMarketsResponse> | undefined): Record<number, number> {
  const volumes: Record<number, number> = {}
  for (const market of data?.markets ?? []) {
    if (market.stats?.volumeUsd !== undefined) {
      volumes[market.chainId] = market.stats.volumeUsd
    }
  }
  return volumes
}

/**
 * Per-chain 24h volume for the TDP token's cross-chain deployments, used by the swap-target
 * highest-volume fallback. V2 flag on: one GetTokenMarkets batch over `multichainToken.addresses`
 * (the V2 multichain shape carries no per-chain market data). Flag off: derived from the legacy
 * TokenWeb `project.tokens` rows.
 */
export function useTDPPerChainVolume({ enabled }: { enabled: boolean }): Record<number, number> | undefined {
  const isV2TokensEnabled = useIsV2TokensEnabled()
  const { multichainToken, tokenQuery } = useTDPStore((s) => ({
    multichainToken: s.multichainToken,
    tokenQuery: s.tokenQuery,
  }))

  const deployments = useMemo(
    () =>
      Object.entries(multichainToken?.addresses ?? {})
        .map(([chainIdKey, address]) => ({ chainId: Number(chainIdKey), address }))
        .filter((deployment) => isUniverseChainId(deployment.chainId)),
    [multichainToken?.addresses],
  )

  const { data: restVolumes } = useQuery(
    getGetTokenMarketsQueryOptions({
      params: deployments.length > 0 ? { tokens: deployments, duration: HistoryDuration.DAY } : undefined,
      enabled: isV2TokensEnabled && enabled && deployments.length > 1,
      select: selectVolumeByChainId,
    }),
  )

  const legacyVolumes = useMemo(() => {
    if (isV2TokensEnabled) {
      return undefined
    }
    const rows = tokenQuery.data?.token?.project?.tokens
    if (!rows) {
      return undefined
    }
    const volumes: Record<number, number> = {}
    for (const row of rows) {
      const chainId = fromGraphQLChain(row.chain)
      const volume = row.market?.volume24H?.value
      if (chainId && volume !== undefined) {
        volumes[chainId] = volume
      }
    }
    return volumes
  }, [isV2TokensEnabled, tokenQuery.data?.token?.project?.tokens])

  return isV2TokensEnabled ? restVolumes : legacyVolumes
}

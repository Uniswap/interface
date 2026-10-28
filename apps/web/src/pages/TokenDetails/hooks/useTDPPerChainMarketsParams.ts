import type { PartialMessage } from '@bufbuild/protobuf'
import type { GetTokenMarketsRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

/** Shared by every per-chain GetTokenMarkets reader so they hit one cache key. */
export function useTDPPerChainMarketsParams(): PartialMessage<GetTokenMarketsRequest> | undefined {
  const addresses = useTDPStore((s) => s.multichainToken?.addresses)

  return useMemo(() => {
    const tokens = Object.entries(addresses ?? {})
      .map(([chainIdKey, address]) => ({ chainId: Number(chainIdKey), address }))
      .filter((deployment) => isUniverseChainId(deployment.chainId))
    return tokens.length > 1 ? { tokens, duration: HistoryDuration.DAY } : undefined
  }, [addresses])
}

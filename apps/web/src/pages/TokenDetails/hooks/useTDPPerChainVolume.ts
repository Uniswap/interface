import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenMarketsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { getGetTokenMarketsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useTDPPerChainMarketsParams } from '~/pages/TokenDetails/hooks/useTDPPerChainMarketsParams'

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

export function useTDPPerChainVolume({ enabled }: { enabled: boolean }): Record<number, number> | undefined {
  const params = useTDPPerChainMarketsParams()

  const { data } = useQuery(
    getGetTokenMarketsQueryOptions({
      params,
      enabled,
      select: selectVolumeByChainId,
    }),
  )

  return data
}

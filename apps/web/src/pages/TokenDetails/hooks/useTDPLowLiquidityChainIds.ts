import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenMarketsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { getGetTokenMarketsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useTDPPerChainMarketsParams } from '~/pages/TokenDetails/hooks/useTDPPerChainMarketsParams'

export const LOW_LIQUIDITY_TVL_USD = 1_000
export const LIQUID_NETWORK_TVL_USD = 10_000

const EMPTY_CHAIN_IDS: UniverseChainId[] = []

type TvlByChain = Map<UniverseChainId, number>

function selectTvlByChain(data: PlainMessage<GetTokenMarketsResponse> | undefined): TvlByChain {
  const tvlByChain: TvlByChain = new Map()
  for (const market of data?.markets ?? []) {
    const tvl = market.stats?.totalValueLockedUsd
    if (tvl !== undefined) {
      tvlByChain.set(market.chainId as UniverseChainId, tvl)
    }
  }
  return tvlByChain
}

export function getLowLiquidityChainIds(tvlByChain: TvlByChain): UniverseChainId[] {
  const tvls = [...tvlByChain.values()]
  if (!tvls.some((tvl) => tvl > LIQUID_NETWORK_TVL_USD)) {
    return EMPTY_CHAIN_IDS
  }
  return [...tvlByChain].filter(([, tvl]) => tvl < LOW_LIQUIDITY_TVL_USD).map(([chainId]) => chainId)
}

export function useTDPLowLiquidityChainIds(): UniverseChainId[] {
  const params = useTDPPerChainMarketsParams()

  const { data: tvlByChain } = useQuery(getGetTokenMarketsQueryOptions({ params, select: selectTvlByChain }))

  return useMemo(() => (tvlByChain ? getLowLiquidityChainIds(tvlByChain) : EMPTY_CHAIN_IDS), [tvlByChain])
}

import type { PlainMessage } from '@bufbuild/protobuf'
import type { GetTokenHistoryPriceResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { UniverseChainId } from '@universe/chains'
import {
  type GetTokenHistoryPriceInput,
  getGetTokenHistoryPriceQueryOptions,
  getGetTokenMultiChainQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import {
  type HistoryTarget,
  toHistoryTarget,
  toRestHistoryDuration,
} from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { toHistoryDuration } from '~/data/util'
import { TDP_DEFAULT_TIME_PERIOD } from '~/pages/TokenDetails/components/chart/TDPChartState'

/**
 * The token-detail-page query keys, built in one place. The TDP's own consumers
 * (useCreateTDPContext, useTokenPriceChartData) and any prefetcher warming the page ahead of
 * navigation build their keys through these helpers, so a warmed key can never silently drift from
 * the one the page actually requests.
 */

/** Multichain metadata query that gates the TDP skeleton. */
export function getTdpTokenMultiChainQueryOptions({
  chainId,
  address,
  isNative,
  enabled,
}: {
  chainId: UniverseChainId
  address: string
  isNative: boolean
  enabled?: boolean
}) {
  const currencyId = isNative ? buildNativeCurrencyId(chainId) : buildCurrencyId(chainId, address)
  return getGetTokenMultiChainQueryOptions({
    params: { identifier: { case: 'token', value: currencyIdToRestContractInput(currencyId) } },
    enabled,
  })
}

/** Price-history query for the TDP line chart. Owns the REST duration mapping so the key can't drift. */
export function getTdpTokenPriceHistoryQueryOptions<TSelectData = PlainMessage<GetTokenHistoryPriceResponse>>({
  target,
  duration,
  ...rest
}: {
  target: HistoryTarget
  duration: HistoryDuration
} & Omit<GetTokenHistoryPriceInput<TSelectData>, 'params'>): ReturnType<
  typeof getGetTokenHistoryPriceQueryOptions<TSelectData>
> {
  return getGetTokenHistoryPriceQueryOptions<TSelectData>({
    ...rest,
    params: { target, duration: toRestHistoryDuration(duration) },
  })
}

/**
 * The exact price-history query the TDP issues on first paint — line chart, DAY period, single-chain
 * (the ChartSection / TDPChartState defaults). Prefetchers call this so warming the chart cache
 * reuses the page's own default choices instead of hard-coding them.
 */
export function getTdpInitialPriceHistoryQueryOptions({
  chainId,
  address,
}: {
  chainId: UniverseChainId
  address: string
}) {
  return getTdpTokenPriceHistoryQueryOptions({
    target: toHistoryTarget({ chainId, address, multichain: false }),
    duration: toHistoryDuration(TDP_DEFAULT_TIME_PERIOD),
  })
}

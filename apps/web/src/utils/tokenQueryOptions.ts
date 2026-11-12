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
import { TimePeriod, toHistoryDuration } from '~/data/util'

/** Time period the token price chart opens on. Prefetchers warm this period's key. */
export const DEFAULT_TOKEN_CHART_TIME_PERIOD = TimePeriod.DAY

/**
 * Token query keys, built in one place. The token details page (useCreateTDPContext,
 * useTokenPriceChartData) and any prefetcher warming it ahead of navigation build their keys through
 * these helpers, so a warmed key can never silently drift from the one the page actually requests.
 */

/** Multichain metadata query that gates the TDP skeleton. */
export function getTokenMultiChainQueryOptions({
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

/** Price-history query for the token line chart. Owns the REST duration mapping so the key can't drift. */
export function getTokenPriceHistoryQueryOptions<TSelectData = PlainMessage<GetTokenHistoryPriceResponse>>({
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
export function getInitialTokenPriceHistoryQueryOptions({
  chainId,
  address,
}: {
  chainId: UniverseChainId
  address: string
}) {
  return getTokenPriceHistoryQueryOptions({
    target: toHistoryTarget({ chainId, address, multichain: false }),
    duration: toHistoryDuration(DEFAULT_TOKEN_CHART_TIME_PERIOD),
  })
}

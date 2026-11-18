import { type PartialMessage, type PlainMessage } from '@bufbuild/protobuf'
import { hashKey, useQuery } from '@tanstack/react-query'
import type {
  GetTokenBuySellStatsRequest,
  GetTokenBuySellStatsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { BuySellStatsWindow } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { getGetTokenBuySellStatsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import {
  mapTokenBuySellStats,
  type TokenBuySellStatsData,
} from 'uniswap/src/features/dataApi/tokenDetails/tokenBuySellStatsUtils'
import { useTokenMarketsEnabledChainIds } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { CurrencyId } from 'uniswap/src/types/currency'

export interface UseTokenBuySellStatsParams {
  window: BuySellStatsWindow
  isMultichainAggregateView?: boolean
  skip?: boolean
}

export interface UseTokenBuySellStatsResult {
  data: TokenBuySellStatsData | undefined
  /** No volume to show for this window: unset `stats`, or swaps with neither USD nor token volume. Not an error. */
  isUnavailable: boolean
  isLoading: boolean
  error: Error | null
}

type TokenBuySellStatsRequestParams = PartialMessage<GetTokenBuySellStatsRequest>

/** Same token and chain scope, so only the window differs. */
function isSameScope(
  previous: TokenBuySellStatsRequestParams | undefined,
  next: TokenBuySellStatsRequestParams | undefined,
): boolean {
  return (
    !!previous &&
    !!next &&
    hashKey([previous.identifier, previous.chainIds]) === hashKey([next.identifier, next.chainIds])
  )
}

function selectTokenBuySellStats(
  data: PlainMessage<GetTokenBuySellStatsResponse> | undefined,
): TokenBuySellStatsData | undefined {
  return data?.stats ? mapTokenBuySellStats(data.stats) : undefined
}

/**
 * Buy/sell counts, volume and unique wallets for one window. The backend resolves the token to its
 * multichain group either way; `chainIds` picks the scope: every enabled chain for the all-networks
 * view, or just the token's own chain.
 */
export function useTokenBuySellStats(
  currencyId: CurrencyId | undefined,
  { window, isMultichainAggregateView = false, skip = false }: UseTokenBuySellStatsParams,
): UseTokenBuySellStatsResult {
  const token = useMemo(() => (currencyId ? currencyIdToRestContractInput(currencyId) : undefined), [currencyId])
  const enabledChainIds = useTokenMarketsEnabledChainIds()
  const chainIds = isMultichainAggregateView ? enabledChainIds : token && [token.chainId]

  const params: TokenBuySellStatsRequestParams | undefined = token
    ? { identifier: { case: 'token', value: token }, chainIds, window }
    : undefined

  const { data, isSuccess, isLoading, error } = useQuery({
    ...getGetTokenBuySellStatsQueryOptions({ params, enabled: !skip, select: selectTokenBuySellStats }),
    // Hold the last numbers across a window switch only. A new token or chain scope must show its
    // loading state rather than another scope's numbers.
    placeholderData: (previousData, previousQuery) =>
      isSameScope(previousQuery?.queryKey[2], params) ? previousData : undefined,
  })

  return {
    data,
    isUnavailable: isSuccess && !data,
    isLoading,
    error,
  }
}

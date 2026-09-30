import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { tokenRankings } from '@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery'
import {
  TokenRankingsRequest,
  TokenRankingsResponse,
  TokenRankingsStat,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { uniswapGetTransport } from 'uniswap/src/data/transport'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { parseCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service TokenRankings
 * This includes the top tokens pre-sorted by various filters
 * @param input { chainId: string } - string representation of the chain to query or `ALL_NETWORKS` for aggregated data
 * @param options.select - TanStack `select`. Pass a `useCallback` whose deps include everything the transform
 *   closes over: TanStack reuses the last result until `data` or `select` changes identity, so a permanently
 *   stable reference (e.g. `useEvent`) never recomputes.
 * @returns UseQueryResult<TData, ConnectError>
 */
export function useTokenRankingsQuery<TData = TokenRankingsResponse>(
  input?: PartialMessage<TokenRankingsRequest>,
  { enabled = true, select }: { enabled?: boolean; select?: (data: TokenRankingsResponse) => TData } = {},
): UseQueryResult<TData, ConnectError> {
  return useQuery(tokenRankings, input, { transport: uniswapGetTransport, enabled, select })
}

export function tokenRankingsStatToCurrencyInfo(tokenRankingsStat: TokenRankingsStat): CurrencyInfo | null {
  const { chain, address, symbol, name, logo, decimals, feeData } = tokenRankingsStat
  const chainId = fromGraphQLChain(chain)

  if (!chainId || !symbol || !name) {
    return null
  }

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol,
    name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: logo,
    safetyInfo: parseCurrencySafetyInfo(tokenRankingsStat.safetyLevel, tokenRankingsStat.protectionInfo),
  })
}

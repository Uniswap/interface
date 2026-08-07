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
import { parseProtectionInfo, parseSafetyLevel } from '@universe/api'
import { uniswapGetTransport } from 'uniswap/src/data/transport'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service TokenRankings
 * This includes the top tokens pre-sorted by various filters
 * @param input { chainId: string } - string representation of the chain to query or `ALL_NETWORKS` for aggregated data
 * @returns UseQueryResult<TokenRankingsResponse, ConnectError>
 */
export function useTokenRankingsQuery(
  input?: PartialMessage<TokenRankingsRequest>,
  enabled = true,
): UseQueryResult<TokenRankingsResponse, ConnectError> {
  return useQuery(tokenRankings, input, { transport: uniswapGetTransport, enabled })
}

/** Market fields the rankings payload already carries; read by TokenSelectorV2 rows (legacy selector ignores them). */
export interface TokenRankingsMarketData {
  priceUsd?: number
  pricePercentChange24h?: number
  networkCount?: number
}

export function tokenRankingsStatToMarketData(tokenRankingsStat: TokenRankingsStat): TokenRankingsMarketData {
  const { price, pricePercentChange1Day, chainTokens } = tokenRankingsStat
  return {
    priceUsd: price?.value,
    pricePercentChange24h: pricePercentChange1Day?.value,
    networkCount: chainTokens.length > 1 ? chainTokens.length : undefined,
  }
}

export function tokenRankingsStatToCurrencyInfo(tokenRankingsStat: TokenRankingsStat): CurrencyInfo | null {
  const { chain, address, symbol, name, logo, decimals, feeData } = tokenRankingsStat
  const chainId = fromGraphQLChain(chain)
  const protectionInfo = parseProtectionInfo(tokenRankingsStat.protectionInfo)
  const safetyLevel = parseSafetyLevel(tokenRankingsStat.safetyLevel)

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
    safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
  })
}

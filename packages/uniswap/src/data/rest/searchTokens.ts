import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { searchTokens } from '@uniswap/client-search/dist/search/v1/api-searchService_connectquery'
import {
  SpamCode as SearchSpamCode,
  SearchTokensRequest,
  SearchTokensResponse,
  type Token as SearchToken,
} from '@uniswap/client-search/dist/search/v1/api_pb'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { uniswapPostTransport } from 'uniswap/src/data/rest/base'
import { parseProtectionInfo, parseSafetyLevel } from 'uniswap/src/data/rest/utils'
import { isUniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo, getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * Wrapper around Tanstack useQuery for the Ring REST BE service SearchTokens
 * This includes data for token search
 * @param input - The search request parameters including search query, chain IDs, search type, page and size
 * @returns data, error, isPending, and refetch
 */
export function useSearchTokensQuery({
  input,
  enabled = true,
}: {
  input?: PartialMessage<SearchTokensRequest>
  enabled?: boolean
}): UseQueryResult<SearchTokensResponse, ConnectError> {
  return useQuery(searchTokens, input, {
    transport: uniswapPostTransport,
    enabled: !!input && enabled,
  })
}

export function searchTokenToCurrencyInfo(token: SearchToken): CurrencyInfo | null {
  const { chainId, address, symbol, name, decimals, logoUrl, feeData } = token
  if (!isUniverseChainId(chainId)) {
    return null
  }

  const safetyLevel = parseSafetyLevel(token.safetyLevel)
  const protectionInfo = parseProtectionInfo(
    token.protectionInfo as Parameters<typeof parseProtectionInfo>[0] | undefined,
  )

  const currency = buildCurrency({
    chainId,
    // TODO: backend currently returns 'ETH' for some native tokens, remove this check once BE fixes
    address: address === 'ETH' ? getNativeAddress(chainId) : address,
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
    logoUrl,
    safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
    isSpam: token.spamCode !== SearchSpamCode.NOT_SPAM,
  })
}

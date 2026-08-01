import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { createQueryOptions, useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { searchTokens } from '@uniswap/client-data-api/dist/data/v1/search-SearchService_connectquery'
import { SearchTokensRequest, SearchTokensResponse } from '@uniswap/client-data-api/dist/data/v1/search_pb'
import {
  Pool,
  type SearchAuction,
  SearchType,
  Token as SearchToken,
  ChainToken,
  MultichainToken,
} from '@uniswap/client-data-api/dist/data/v1/searchTypes_pb'
import { parseProtectionInfo, parseRestProtocolVersion, parseSafetyLevel, SharedQueryClient } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/rest/base'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { type CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { PoolSearchHistoryResult, SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId, currencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'
import { ONE_DAY_MS, ONE_HOUR_MS } from 'utilities/src/time/time'

const FILE_NAME = 'searchTokensAndPools.ts'

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service SearchTokens
 * This includes data for both token search AND pool search
 * @param input - The search request parameters including search query, chain IDs, search type, page and size
 * @returns data, error, isPending, and refetch
 */
export function useSearchTokensAndPoolsQuery<TSelectType>({
  input,
  enabled = true,
  select,
}: {
  input?: PartialMessage<SearchTokensRequest>
  enabled?: boolean
  select?: ((data: SearchTokensResponse) => TSelectType) | undefined
}): UseQueryResult<TSelectType, ConnectError> {
  return useQuery(searchTokens, input, {
    transport: entryGatewayProdPostTransport,
    enabled: !!input && enabled,
    select,
  })
}

/**
 * Fetch a single token by address outside of React components
 * @param chainId - The chain ID to search on
 * @param address - The token address to look up
 * @returns Token data or null if not found
 */
export async function fetchTokenByAddress({
  chainId,
  address,
}: {
  chainId: UniverseChainId
  address: string
}): Promise<SearchToken | null> {
  const log = createLogger(FILE_NAME, 'fetchTokenByAddress')

  try {
    const result = await SharedQueryClient.fetchQuery({
      ...createQueryOptions(
        searchTokens,
        {
          searchQuery: address,
          chainIds: [chainId],
          searchType: SearchType.TOKEN,
          size: 1,
          page: 1,
        },
        { transport: entryGatewayProdPostTransport },
      ),
      // Token data does not change often, so we can use stale data here.
      // This data will be refreshed when fetching the portfolio balances anyway.
      staleTime: ONE_HOUR_MS,
      gcTime: ONE_DAY_MS,
    })

    const token = result.tokens[0] ?? null

    if (!token) {
      log.debug('Token not found in search results', { chainId, address })
    }

    return token
  } catch (error) {
    log.error(error, {
      chainId,
      address,
    })
    return null
  }
}

/**
 * Fetch a single auction by token address outside of React components.
 * Shares the same entry-gateway transport as the token/pool search so the
 * dev-vs-prod routing choice stays defined in one place.
 * @param chainId - The chain ID to search on
 * @param address - The token address to look up
 * @returns The matching auction, or undefined if none is found
 */
export async function fetchAuctionByAddress({
  chainId,
  address,
}: {
  chainId: number
  address: string
}): Promise<SearchAuction | undefined> {
  const result = await SharedQueryClient.fetchQuery(
    createQueryOptions(
      searchTokens,
      {
        searchQuery: address,
        chainIds: [chainId],
        searchType: SearchType.AUCTION,
        size: 1,
        page: 1,
      },
      { transport: entryGatewayProdPostTransport },
    ),
  )

  return result.auctions[0]
}

export function searchTokenToCurrencyInfo(token: SearchToken): CurrencyInfo | null {
  const { chainId, address, symbol, name, decimals, logoUrl, feeData } = token
  const safetyLevel = parseSafetyLevel(token.safetyLevel)
  const protectionInfo = parseProtectionInfo(token.protectionInfo)

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

  const safetyInfo = getCurrencySafetyInfo(safetyLevel, protectionInfo)

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({ currency, currencyId: currencyId(currency), logoUrl, safetyInfo })
}

/**
 * Converts a single ChainToken into a CurrencyInfo, using shared metadata from the
 * parent MultichainToken. Per-chain feeData/protectionInfo/safetyLevel override
 * the parent when present. Returns null if the currency can't be constructed.
 */
export function chainTokenToCurrencyInfo(
  chainToken: ChainToken,
  multichainToken: MultichainToken,
): CurrencyInfo | null {
  // safetyLevel is a string proto field (defaults to '' not undefined), so || correctly treats empty as "not set"
  const safetyLevel = parseSafetyLevel(chainToken.safetyLevel || multichainToken.safetyLevel)
  const protectionInfo = parseProtectionInfo(chainToken.protectionInfo ?? multichainToken.protectionInfo)
  const feeData = chainToken.feeData ?? multichainToken.feeData

  const currency = buildCurrency({
    chainId: chainToken.chainId,
    // TODO: backend currently returns 'ETH' for some native tokens, remove this check once BE fixes
    address: chainToken.address === 'ETH' ? getNativeAddress(chainToken.chainId) : chainToken.address,
    decimals: chainToken.decimals,
    symbol: multichainToken.symbol,
    name: multichainToken.name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  const safetyInfo = getCurrencySafetyInfo(safetyLevel, protectionInfo)
  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: multichainToken.logoUrl || undefined,
    safetyInfo,
  })
}

/**
 * Flattens a MultichainToken into one CurrencyInfo per chain.
 */
export function multichainTokenToCurrencyInfos(multichainToken: MultichainToken): CurrencyInfo[] {
  const infos = multichainToken.chainTokens
    .map((chainToken) => chainTokenToCurrencyInfo(chainToken, multichainToken))
    .filter((c): c is CurrencyInfo => c !== null)

  if (!infos.length) {
    return []
  }

  const tokenCurrencyIds = infos.map((i) => i.currencyId) as CurrencyId[]
  const searchMultichainParent = { id: multichainToken.multichainId, tokenCurrencyIds }

  return infos.map((info) => ({
    ...info,
    searchMultichainParent,
  }))
}

export function searchPoolToPoolSearchResult(pool: Pool): PoolSearchHistoryResult | undefined {
  const protocolVersion = parseRestProtocolVersion(pool.protocolVersion)
  if (!pool.token0 || !pool.token1 || !protocolVersion) {
    return undefined
  }
  const token0Address = isNativeCurrencyAddress(pool.chainId, pool.token0.address)
    ? getNativeAddress(pool.chainId)
    : pool.token0.address
  const token1Address = isNativeCurrencyAddress(pool.chainId, pool.token1.address)
    ? getNativeAddress(pool.chainId)
    : pool.token1.address
  return {
    type: SearchHistoryResultType.Pool,
    chainId: pool.chainId,
    poolId: pool.id,
    protocolVersion,
    hookAddress: pool.hookAddress,
    feeTier: pool.feeTier,
    token0CurrencyId: buildCurrencyId(pool.chainId, token0Address),
    token1CurrencyId: buildCurrencyId(pool.chainId, token1Address),
  }
}

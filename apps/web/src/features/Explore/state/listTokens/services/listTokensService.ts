import type { PartialMessage } from '@bufbuild/protobuf'
import type { ListTokensRequest, ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, type RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { PricePoint } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { tokenStatsToRankedMultichainTokens } from '~/features/Explore/state/listTokens/services/legacy/legacyToRankedMultichainTokens'
import { UseListTokensOptions, type RankedMultichainTokensResult } from '~/features/Explore/state/listTokens/types'
import {
  timePeriodToVolumeOrderBy,
  tokenSortMethodToOrderBy,
} from '~/features/Explore/state/listTokens/utils/topTokensOrderByMappings'
import type { TokenStat } from '~/types/explore'

type ListTokensSourceType = 'legacy' | 'backend_sorted'

interface ListTokensParams {
  chainIds: number[]
  options: Required<UseListTokensOptions>
  pageToken?: string
  pageSize: number
}

export interface ListTokensResult extends RankedMultichainTokensResult {
  nextPageToken?: string
}

/**
 * Service for fetching and returning explore tokens in a unified v2 RankedMultichainToken[]
 * shape. Uses legacy ExploreStats-derived token stats when backend sorting is off, otherwise
 * the real v2 ListTokens backend — whose response is already in the RankedMultichainToken shape.
 */
interface ListTokensService {
  /**
   * Fetches tokens for the given chains and options. Returns paginated
   * multichain tokens and an optional nextPageToken for pagination.
   */
  getListTokens: (params: ListTokensParams) => Promise<ListTokensResult>
}

function buildBackendRequestParams({
  chainIds,
  options,
  pageToken,
  pageSize,
}: ListTokensParams): PartialMessage<ListTokensRequest> {
  const { sortMethod, sortAscending, filterTimePeriod } = options
  const isPriceSorting = sortMethod === TokenSortMethod.PRICE
  const orderBy = isPriceSorting
    ? undefined
    : sortMethod === TokenSortMethod.VOLUME
      ? timePeriodToVolumeOrderBy[filterTimePeriod]
      : tokenSortMethodToOrderBy[sortMethod]

  return {
    chainIds,
    page: { pageSize, pageToken },
    // Required by BE — UNSPECIFIED is rejected. Table sparklines are always 1D regardless of sort/filter.
    sparklineDuration: HistoryDuration.DAY,
    ...(orderBy !== undefined && { sort: { orderBy, ascending: sortAscending } }),
  }
}

/**
 * BE currently only populates 1h price change under stats.priceChange1h, not
 * multichainToken.price.percentChange1h (unlike percentChange1d, which BE does populate on
 * price). Backfill onto price so every consumer — regardless of source — only ever needs to
 * read one field, matching the legacy adapter's shape (which populates price.percentChange1h
 * directly, see legacyToRankedMultichainTokens.ts).
 */
function normalizePriceChange1h(token: RankedMultichainToken): RankedMultichainToken {
  if (!token.multichainToken?.price || token.multichainToken.price.percentChange1h !== undefined) {
    return token
  }

  const clonedToken = token.clone()
  // clonedToken mirrors token's structure, so multichainToken.price is guaranteed to exist here
  clonedToken.multichainToken!.price!.percentChange1h = token.stats?.priceChange1h
  return clonedToken
}

function buildPriceHistoryByMultichainId(tokens: RankedMultichainToken[]): Record<string, PricePoint[]> {
  const priceHistoryByMultichainId: Record<string, PricePoint[]> = {}
  for (const token of tokens) {
    const multichainId = token.multichainToken?.multichainId
    if (!multichainId || !token.sparkline.length) {
      continue
    }
    priceHistoryByMultichainId[multichainId] = token.sparkline.map((point) => ({
      timestamp: Number(point.timestamp),
      value: point.value,
    }))
  }
  return priceHistoryByMultichainId
}

async function getListTokensFromBackend(
  listTokens: (params: PartialMessage<ListTokensRequest>) => Promise<ListTokensResponse>,
  params: ListTokensParams,
): Promise<ListTokensResult> {
  const response = await listTokens(buildBackendRequestParams(params))
  const multichainTokens = response.multichainTokens.map(normalizePriceChange1h)
  return {
    multichainTokens,
    priceHistoryByMultichainId: buildPriceHistoryByMultichainId(multichainTokens),
    nextPageToken: response.page?.nextPageToken,
  }
}

/**
 * Creates a ListTokensService that uses legacy explore stats or backend-sorted ListTokens
 * (v2 request/response shape is always multichain — there's no separate flag for it). Use with
 * useListTokensService for the React hook that wires experiment flags and data sources.
 */
export function createListTokensService(ctx: {
  getSourceType: () => ListTokensSourceType
  getTokenStats: () => TokenStat[] | undefined
  listTokens: (params: PartialMessage<ListTokensRequest>) => Promise<ListTokensResponse>
}): ListTokensService {
  const { getSourceType, getTokenStats, listTokens } = ctx

  return {
    async getListTokens(params) {
      const source = getSourceType()

      if (source === 'legacy') {
        const tokenStats = getTokenStats()
        return tokenStatsToRankedMultichainTokens(tokenStats)
      }

      return getListTokensFromBackend(listTokens, params)
    },
  }
}

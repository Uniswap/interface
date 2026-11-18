import type { PartialMessage } from '@bufbuild/protobuf'
import type { ListTokensRequest } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  HistoryDuration,
  type RankedMultichainToken,
  type TokenListFilter,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { multichainTokenKey } from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { TokenSortMethod } from '~/components/Tokens/constants'
import type { PricePoint } from '~/data/util'
import { UseListTokensOptions, type RankedMultichainTokensResult } from '~/features/Explore/state/listTokens/types'
import {
  timePeriodToVolumeOrderBy,
  tokenSortMethodToOrderBy,
} from '~/features/Explore/state/listTokens/utils/topTokensOrderByMappings'
import { toSearchQueryParam } from '~/utils/listRequestParams'

interface ListTokensParams {
  chainIds: number[]
  options: Required<UseListTokensOptions>
  pageToken?: string
  pageSize: number
}

export interface ListTokensResult extends RankedMultichainTokensResult {
  nextPageToken?: string
}

function buildBackendRequestParams({
  chainIds,
  options,
  pageToken,
  pageSize,
}: ListTokensParams): PartialMessage<ListTokensRequest> {
  const { sortMethod, sortAscending, filterTimePeriod, categoryId, filterString } = options
  const orderBy =
    sortMethod === TokenSortMethod.VOLUME
      ? timePeriodToVolumeOrderBy[filterTimePeriod]
      : tokenSortMethodToOrderBy[sortMethod]
  const searchQuery = toSearchQueryParam(filterString)
  // apply_top_level_filters is left unset: the BE defaults it to true, keeping the quality gates on.
  const filter: PartialMessage<TokenListFilter> = {
    ...(categoryId && { categoryIds: [categoryId] }),
    ...(searchQuery && { searchQuery }),
  }

  return {
    chainIds,
    page: { pageSize, pageToken },
    // Required by BE — UNSPECIFIED is rejected. Table sparklines are always 1D regardless of sort/filter.
    sparklineDuration: HistoryDuration.DAY,
    ...(orderBy !== undefined && { sort: { orderBy, ascending: sortAscending } }),
    ...(Object.keys(filter).length > 0 && { filter }),
  }
}

/**
 * BE currently only populates 1h price change under stats.priceChange1h, not
 * multichainToken.price.percentChange1h (unlike percentChange1d, which BE does populate on
 * price). Backfill onto price so every consumer only ever needs to read one field.
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

// Keyed by multichainTokenKey (not raw multichainId): ungrouped tokens all
// share the '' sentinel and would otherwise collide or drop their sparklines.
function buildPriceHistoryByMultichainId(tokens: RankedMultichainToken[]): Record<string, PricePoint[]> {
  const priceHistoryByMultichainId: Record<string, PricePoint[]> = {}
  for (const token of tokens) {
    if (!token.sparkline.length) {
      continue
    }
    priceHistoryByMultichainId[multichainTokenKey(token)] = token.sparkline.map((point) => ({
      timestamp: Number(point.timestamp),
      value: point.value,
    }))
  }
  return priceHistoryByMultichainId
}

export async function getListTokens(params: ListTokensParams): Promise<ListTokensResult> {
  const response = await dataApiServiceClientV2.listTokens(buildBackendRequestParams(params))
  const multichainTokens = response.multichainTokens.map(normalizePriceChange1h)
  return {
    multichainTokens,
    priceHistoryByMultichainId: buildPriceHistoryByMultichainId(multichainTokens),
    nextPageToken: response.page?.nextPageToken,
  }
}

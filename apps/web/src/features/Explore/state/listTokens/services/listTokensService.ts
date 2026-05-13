import type { PartialMessage } from '@bufbuild/protobuf'
import type { ListTokensRequest, ListTokensResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { tokenStatsToMultichainTokens } from '~/features/Explore/state/listTokens/services/legacy/legacyToMultichainTokens'
import { UseListTokensOptions } from '~/features/Explore/state/listTokens/types'
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

interface ListTokensResult {
  multichainTokens: MultichainToken[]
  nextPageToken?: string
}

/**
 * Service for fetching and returning explore tokens in a unified MultichainToken[]
 * shape. Uses legacy ExploreStats-derived token stats when backend sorting is off,
 * otherwise ListTokens with multichain: true.
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
    pageToken,
    pageSize,
    ...(orderBy && { orderBy }),
    ...(!isPriceSorting && { ascending: sortAscending }),
  }
}

async function getListTokensFromBackend(
  listTokens: (params: PartialMessage<ListTokensRequest>) => Promise<ListTokensResponse>,
  params: ListTokensParams,
): Promise<ListTokensResponse> {
  const base = buildBackendRequestParams(params)
  return listTokens({ ...base, multichain: true })
}

/**
 * Creates a ListTokensService that uses legacy explore stats or backend-sorted
 * ListTokens (always multichain). Use with useListTokensService for the React hook
 * that wires experiment flags and data sources.
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
        const multichainTokens = tokenStatsToMultichainTokens(tokenStats)
        return { multichainTokens }
      }

      return getListTokensFromBackend(listTokens, params)
    },
  }
}

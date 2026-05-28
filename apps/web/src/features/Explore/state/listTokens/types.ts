import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { SparklineMap } from '~/appGraphql/data/types'
import { TimePeriod } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'

/** Result shape returned by useListTokensService (data + loading/pagination + tokenSortRank). */
export interface UseListTokensServiceResult {
  topTokens: MultichainToken[]
  /** multichainId → 1-based rank from the search-unfiltered list (stable while filtering the table). */
  tokenSortRank: Record<string, number>
  isLoading: boolean
  isError: boolean
  loadMore: ((params: { onComplete?: () => void }) => void) | undefined
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

/** Result shape returned by useListTokens (adds explore-specific sparklines). */
export interface UseListTokensResult extends UseListTokensServiceResult {
  sparklines: SparklineMap
}

/** Optional flat options for top tokens. When provided, used instead of Explore filter store (e.g. for TDP carousel). */
export type UseListTokensOptions = {
  sortMethod?: TokenSortMethod
  sortAscending?: boolean
  filterString?: string
  filterTimePeriod?: TimePeriod
}

export type UseListTokensSortOptions = Required<Pick<UseListTokensOptions, 'sortMethod' | 'sortAscending'>>

const DEFAULT_OPTIONS: Required<UseListTokensOptions> = {
  sortMethod: TokenSortMethod.VOLUME,
  sortAscending: false,
  filterString: '',
  filterTimePeriod: TimePeriod.DAY,
}

export function getEffectiveListTokensOptions(options?: UseListTokensOptions): Required<UseListTokensOptions> {
  const o = options ?? {}
  return {
    ...DEFAULT_OPTIONS,
    ...o,
  }
}

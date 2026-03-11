import { TimePeriod } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'

/** Optional flat options for top tokens. When provided, used instead of Explore filter store (e.g. for TDP carousel). */
export type UseTopTokensOptions = {
  sortMethod?: TokenSortMethod
  sortAscending?: boolean
  filterString?: string
  filterTimePeriod?: TimePeriod
}

export type UseTopTokensSortOptions = Required<Pick<UseTopTokensOptions, 'sortMethod' | 'sortAscending'>>

const DEFAULT_OPTIONS: Required<UseTopTokensOptions> = {
  sortMethod: TokenSortMethod.VOLUME,
  sortAscending: false,
  filterString: '',
  filterTimePeriod: TimePeriod.DAY,
}

export function getEffectiveTopTokensOptions(options?: UseTopTokensOptions): Required<UseTopTokensOptions> {
  const o = options ?? {}
  return {
    ...DEFAULT_OPTIONS,
    ...o,
  }
}

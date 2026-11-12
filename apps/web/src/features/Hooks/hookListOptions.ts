import { OrderDirection } from '~/data/util'
import { EMPTY_HOOK_FILTER_STATE, type HookFilterCriteria, type HookTvlRange } from '~/features/Hooks/hookFilters'
import { HookSortField, type HookVolumePeriod } from '~/features/Hooks/types'

export interface HookListOptions {
  search: string
  filters: HookFilterCriteria
  tvlRange?: HookTvlRange
  sortField: HookSortField
  sortDirection: OrderDirection
  period: HookVolumePeriod
}

export const DEFAULT_HOOK_LIST_OPTIONS: Readonly<HookListOptions> = {
  search: '',
  filters: EMPTY_HOOK_FILTER_STATE,
  sortField: HookSortField.Volume,
  sortDirection: OrderDirection.Desc,
  period: '1d',
}

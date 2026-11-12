import type { HookListOptions } from '~/features/Hooks/hookListOptions'
import { HookSortField } from '~/features/Hooks/types'

export function getHookSortMethod({ period, sortField }: Pick<HookListOptions, 'period' | 'sortField'>): string {
  return sortField === HookSortField.Volume ? `${sortField}_${period}` : sortField
}

export function getHookSortAnalyticsValue({
  period,
  sortField,
  sortDirection,
}: Pick<HookListOptions, 'period' | 'sortField' | 'sortDirection'>): string {
  return `${getHookSortMethod({ period, sortField })}_${sortDirection}`
}

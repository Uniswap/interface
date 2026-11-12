import { areEvmAddressesEqual, type UniverseChainId } from '@universe/chains'
import { OrderDirection } from '~/data/util'
import { matchesHookFilters } from '~/features/Hooks/hookFilters'
import type { HookListOptions } from '~/features/Hooks/hookListOptions'
import { getHookSearchAddress, normalizeHookSearch } from '~/features/Hooks/hookSearch'
import { type Hook, HookAccounting, HookSortField, type HookVolumePeriod } from '~/features/Hooks/types'

export function getRankedHookFixtures({
  fixtures,
  chainId,
  search,
  filters,
  tvlRange,
  sortField,
  sortDirection,
  period,
}: {
  fixtures: readonly Hook[]
  chainId?: UniverseChainId
} & HookListOptions): Hook[] {
  const normalizedSearch = normalizeHookSearch(search)
  const searchAddress = getHookSearchAddress(normalizedSearch)
  const hooks = fixtures.flatMap((hook): Hook[] => {
    if (chainId === undefined) {
      return [hook]
    }
    const deployment = hook.deployments.find((candidate) => candidate.chainId === chainId)
    return deployment ? [{ ...hook, deployments: [deployment], metrics: deployment.metrics }] : []
  })
  const volume = (hook: Hook, volumePeriod: HookVolumePeriod): number | null =>
    hook.deployments.some((deployment) => deployment.accounting === HookAccounting.Custom)
      ? null
      : hook.metrics.volumeUsd[volumePeriod]
  const sortValue = (hook: Hook): number | null => {
    if (sortField === HookSortField.Volume) {
      return volume(hook, period)
    }
    if (sortField === HookSortField.Tvl) {
      return hook.metrics.tvlUsd
    }
    return hook.metrics.poolCount
  }
  const isInactive = (hook: Hook): boolean => hook.metrics.tvlUsd === 0 || volume(hook, period) === 0

  return hooks
    .filter((hook) => matchesHookFilters(hook, { ...filters, tvlRange }))
    .filter((hook) => {
      if (searchAddress) {
        return hook.deployments.some((deployment) => areEvmAddressesEqual(deployment.address, searchAddress))
      }
      return !normalizedSearch || hook.name?.toLowerCase().startsWith(normalizedSearch)
    })
    .sort((left, right) => {
      const leftValue = sortValue(left)
      const rightValue = sortValue(right)
      if (leftValue === null && rightValue !== null) {
        return 1
      }
      if (rightValue === null && leftValue !== null) {
        return -1
      }
      if (leftValue !== null && rightValue !== null) {
        const inactiveDifference = Number(isInactive(left)) - Number(isInactive(right))
        if (inactiveDifference !== 0) {
          return inactiveDifference
        }
        const zeroDifference = Number(leftValue === 0) - Number(rightValue === 0)
        if (zeroDifference !== 0) {
          return zeroDifference
        }
        if (leftValue !== rightValue) {
          return sortDirection === OrderDirection.Asc ? leftValue - rightValue : rightValue - leftValue
        }
      }
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0
    })
}

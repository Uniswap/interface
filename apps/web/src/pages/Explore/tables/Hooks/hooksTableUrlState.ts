import { createLoader, createSerializer, parseAsBoolean, parseAsString, parseAsStringLiteral } from 'nuqs/server'
import { OrderDirection } from '~/data/util'
import type { HookFilterState } from '~/features/Hooks/hookFilters'
import { DEFAULT_HOOK_LIST_OPTIONS, type HookListOptions } from '~/features/Hooks/hookListOptions'
import { HookSortField } from '~/features/Hooks/types'
import { POOLS_FILTER_TVL_BUCKETS } from '~/features/Liquidity/PoolsFilter/constants'

export type HooksTableUrlState = Pick<HookListOptions, 'search' | 'sortField' | 'sortDirection'> & {
  filters: HookFilterState
}

type HooksTableUrlChanges = { [Key in keyof HooksTableUrlState]?: HooksTableUrlState[Key] | null }

const hooksTableParsers = {
  search: parseAsString.withDefault(DEFAULT_HOOK_LIST_OPTIONS.search),
  sortField: parseAsStringLiteral(Object.values(HookSortField)).withDefault(DEFAULT_HOOK_LIST_OPTIONS.sortField),
  sortDirection: parseAsStringLiteral(Object.values(OrderDirection)).withDefault(
    DEFAULT_HOOK_LIST_OPTIONS.sortDirection,
  ),
  tvlBucketId: parseAsStringLiteral(POOLS_FILTER_TVL_BUCKETS.map((bucket) => bucket.id)),
  routedOnly: parseAsBoolean.withDefault(false),
  verifiedSourceOnly: parseAsBoolean.withDefault(false),
  metadataOnly: parseAsBoolean.withDefault(false),
}

const urlKeys = {
  search: 'hookSearch',
  sortField: 'hookSort',
  sortDirection: 'hookSortDirection',
  tvlBucketId: 'hookTvl',
  routedOnly: 'hookRouted',
  verifiedSourceOnly: 'hookVerifiedSource',
  metadataOnly: 'hookMetadata',
}
const loadHooksTableParams = createLoader(hooksTableParsers, { urlKeys })
const serializeHooksTableState = createSerializer(hooksTableParsers, { urlKeys })

export function serializeHooksTableParams(searchParams: URLSearchParams, changes: HooksTableUrlChanges): string {
  const { filters, ...state } = changes
  return serializeHooksTableState(searchParams, {
    ...state,
    ...(filters !== undefined && {
      tvlBucketId: filters?.tvlBucketId ?? null,
      routedOnly: filters?.routedOnly ?? false,
      verifiedSourceOnly: filters?.verifiedSourceOnly ?? false,
      metadataOnly: filters?.metadataOnly ?? false,
    }),
  })
}

export function parseHooksTableParams(searchParams: URLSearchParams): HooksTableUrlState {
  const { tvlBucketId, routedOnly, verifiedSourceOnly, metadataOnly, ...state } = loadHooksTableParams(searchParams)
  return {
    ...state,
    filters: { tvlBucketId: tvlBucketId ?? undefined, routedOnly, verifiedSourceOnly, metadataOnly },
  }
}

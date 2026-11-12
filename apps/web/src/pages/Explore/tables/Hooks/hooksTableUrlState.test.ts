import { OrderDirection } from '~/data/util'
import { EMPTY_HOOK_FILTER_STATE } from '~/features/Hooks/hookFilters'
import { HookSortField } from '~/features/Hooks/types'
import { parseHooksTableParams, serializeHooksTableParams } from '~/pages/Explore/tables/Hooks/hooksTableUrlState'

describe('Hooks table URL state', () => {
  it('restores the shared URL search and validated sort while defaulting malformed values', () => {
    expect(
      parseHooksTableParams(new URLSearchParams('hookSearch=Angstrom&hookSort=tvl&hookSortDirection=asc')),
    ).toEqual({
      search: 'Angstrom',
      sortField: HookSortField.Tvl,
      sortDirection: OrderDirection.Asc,
      filters: EMPTY_HOOK_FILTER_STATE,
    })
    expect(parseHooksTableParams(new URLSearchParams('hookSort=unknown&hookSortDirection=up'))).toEqual({
      search: '',
      sortField: HookSortField.Volume,
      sortDirection: OrderDirection.Desc,
      filters: EMPTY_HOOK_FILTER_STATE,
    })
  })

  it('removes defaults and only changes Hooks keys, retaining gating, language and scenario', () => {
    const initial = new URLSearchParams(
      'featureFlagOverride=hooks_explore_ux&lng=en-US&hooksFixtureScenario=default&hookSearch=old&hookSort=tvl&hookSortDirection=asc',
    )
    const updated = new URLSearchParams(
      serializeHooksTableParams(initial, {
        search: '0xAbCd',
        sortField: HookSortField.Volume,
        sortDirection: OrderDirection.Desc,
      }),
    )
    expect([...updated]).toEqual([
      ['featureFlagOverride', 'hooks_explore_ux'],
      ['lng', 'en-US'],
      ['hooksFixtureScenario', 'default'],
      ['hookSearch', '0xAbCd'],
    ])
    expect(new URLSearchParams(serializeHooksTableParams(updated, { search: null })).has('hookSearch')).toBe(false)
    expect(initial.get('hookSearch')).toBe('old')
  })

  it.each(['lt-100k', '100k-1m', 'gt-10m'] as const)(
    'round-trips the %s bucket and independent positive toggles',
    (tvlBucketId) => {
      const filters = { tvlBucketId, routedOnly: true, verifiedSourceOnly: true, metadataOnly: true }
      const serialized = new URLSearchParams(serializeHooksTableParams(new URLSearchParams('lng=en-US'), { filters }))

      expect(serialized.get('hookTvl')).toBe(tvlBucketId)
      expect(serialized.get('hookRouted')).toBe('true')
      expect(serialized.get('hookVerifiedSource')).toBe('true')
      expect(serialized.get('hookMetadata')).toBe('true')
      expect(serialized.get('lng')).toBe('en-US')
      expect(parseHooksTableParams(serialized).filters).toEqual(filters)
    },
  )

  it('defaults invalid advanced filters and removes reset values without resetting search or sort', () => {
    const initial = new URLSearchParams(
      'hookTvl=unknown&hookRouted=invalid&hookVerifiedSource=false&hookMetadata=true&hookSearch=Angstrom&hookSort=tvl&featureFlagOverride=hooks_explore_ux',
    )
    expect(parseHooksTableParams(initial).filters).toEqual({ ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true })
    const cleared = new URLSearchParams(serializeHooksTableParams(initial, { filters: EMPTY_HOOK_FILTER_STATE }))

    expect([...cleared.keys()]).toEqual(['hookSearch', 'hookSort', 'featureFlagOverride'])
    expect(parseHooksTableParams(cleared)).toEqual({
      search: 'Angstrom',
      sortField: HookSortField.Tvl,
      sortDirection: OrderDirection.Desc,
      filters: EMPTY_HOOK_FILTER_STATE,
    })
  })

  it('retains applied filters during partial search and sort writes', () => {
    const initial = new URLSearchParams('hookTvl=100k-1m&hookRouted=true&hookMetadata=true&lng=en-US')
    const updated = new URLSearchParams(
      serializeHooksTableParams(initial, { search: 'new', sortField: HookSortField.Pools }),
    )
    expect(parseHooksTableParams(updated).filters).toEqual({
      ...EMPTY_HOOK_FILTER_STATE,
      tvlBucketId: '100k-1m',
      routedOnly: true,
      metadataOnly: true,
    })
    expect(updated.get('lng')).toBe('en-US')
  })
})

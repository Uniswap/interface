import { QueryClient } from '@tanstack/react-query'
import { isEVMChain, UniverseChainId } from '@universe/chains'
import { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrderDirection } from '~/data/util'
import {
  EMPTY_HOOK_LIST_SUMMARY_FIXTURE,
  HOOK_FIXTURES,
  HOOK_LIST_SUMMARY_FIXTURE,
  parseHooksFixtureScenario,
} from '~/features/Hooks/fixtures'
import { EMPTY_HOOK_FILTER_STATE } from '~/features/Hooks/hookFilters'
import { DEFAULT_HOOK_LIST_OPTIONS } from '~/features/Hooks/hookListOptions'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import {
  getUniqueHooks,
  hookDetailQueryOptions,
  hookListInfiniteQueryOptions,
  hookListSummaryQueryOptions,
} from '~/features/Hooks/queries'
import { HookAccounting, HookIndexingStatus, HooksFixtureScenario, HookSortField } from '~/features/Hooks/types'

const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })

afterEach(() => {
  queryClient.clear()
})

describe('Hooks fixture queries', () => {
  it('keeps every preview deployment usable as an EVM detail identity', () => {
    for (const hook of HOOK_FIXTURES) {
      for (const deployment of hook.deployments) {
        expect(isEVMChain(deployment.chainId)).toBe(true)
        expect(isEVMAddressWithChecksum(deployment.address)).toBe(true)
      }
    }
  })

  it('isolates fixture caches by every committed filter, ordering and pagination dimension', () => {
    const list = hookListInfiniteQueryOptions({ pageSize: 100 })
    expect(list.queryKey[0]).toBe(ReactQueryCacheKey.Hooks)
    expect(list.queryKey).toContain('fixture')
    expect(list.queryKey).toContain('infinite-list')
    expect(list.queryKey).not.toContain('list')
    expect(list.queryKey).not.toEqual(
      hookListInfiniteQueryOptions({ pageSize: 100, scenario: HooksFixtureScenario.Empty }).queryKey,
    )
    expect(list.queryKey).not.toEqual(
      hookListInfiniteQueryOptions({ pageSize: 100, chainId: UniverseChainId.Base }).queryKey,
    )
    expect(list.queryKey).not.toEqual(hookListInfiniteQueryOptions({ pageSize: 2 }).queryKey)
    expect(list.queryKey).not.toEqual(hookListInfiniteQueryOptions({ pageSize: 100, search: 'angstrom' }).queryKey)
    expect(list.queryKey).not.toEqual(
      hookListInfiniteQueryOptions({ pageSize: 100, sortField: HookSortField.Tvl }).queryKey,
    )
    expect(list.queryKey).not.toEqual(
      hookListInfiniteQueryOptions({ pageSize: 100, sortDirection: OrderDirection.Asc }).queryKey,
    )
    expect(list.queryKey).not.toEqual(hookListInfiniteQueryOptions({ pageSize: 100, period: '7d' }).queryKey)
    for (const filters of [
      { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true },
      { ...EMPTY_HOOK_FILTER_STATE, verifiedSourceOnly: true },
      { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
    ]) {
      expect(list.queryKey).not.toEqual(hookListInfiniteQueryOptions({ pageSize: 100, filters }).queryKey)
    }
    expect(list.queryKey).not.toEqual(
      hookListInfiniteQueryOptions({ pageSize: 100, tvlRange: { max: 100_000 } }).queryKey,
    )
    expect(hookListInfiniteQueryOptions({ pageSize: 100, search: '  ANGSTROM  ' }).queryKey).toEqual(
      hookListInfiniteQueryOptions({ pageSize: 100, search: 'angstrom' }).queryKey,
    )
    expect(hookListInfiniteQueryOptions({ pageSize: 100, search: '  ' }).queryKey).toEqual(list.queryKey)
    expect(list.queryKey).not.toEqual(
      hookDetailQueryOptions({
        chainId: UniverseChainId.Mainnet,
        hookAddress: HOOK_FIXTURES[0]!.deployments[0].address,
      }).queryKey,
    )
  })

  it('walks stable cursors after ranking the full collection including zero activity', async () => {
    const result = await queryClient.fetchInfiniteQuery({ ...hookListInfiniteQueryOptions({ pageSize: 2 }), pages: 10 })
    const hooks = getUniqueHooks(result.pages)

    expect(hooks.map((hook) => hook.id)).toEqual([
      'hk_7b8a2e',
      'hk_c51e09',
      'hk_53d1ca',
      'hk_86a4c3',
      'hk_f03d72',
      'hk_2d15bf',
      'hk_a93c10',
    ])
    expect(new Set(hooks.map((hook) => hook.id)).size).toBe(HOOK_FIXTURES.length)
    expect(result.pages.map((page) => page.hooks.length)).toEqual([2, 2, 2, 1])
    expect(result.pageParams).toEqual(['', 'hk_c51e09', 'hk_86a4c3', 'hk_2d15bf'])
    expect(result.pages.map((page) => page.nextCursor)).toEqual(['hk_c51e09', 'hk_86a4c3', 'hk_2d15bf', null])
    expect(hooks.at(-1)?.deployments[0].accounting).toBe(HookAccounting.Custom)
    expect(hooks.at(-1)?.metrics.volumeUsd['1d']).toBeGreaterThan(0)
  })

  it('uses the shared page size and keeps cursor progression independent of page size', async () => {
    const result = await queryClient.fetchInfiniteQuery(hookListInfiniteQueryOptions({ pageSize: 100 }))
    expect(result.pages[0]?.hooks.map((hook) => hook.id)).toEqual([
      'hk_7b8a2e',
      'hk_c51e09',
      'hk_53d1ca',
      'hk_86a4c3',
      'hk_f03d72',
      'hk_2d15bf',
      'hk_a93c10',
    ])
    expect(result.pages[0]?.nextCursor).toBeNull()

    const smallerPages = await queryClient.fetchInfiniteQuery({
      ...hookListInfiniteQueryOptions({ pageSize: 1 }),
      pages: 10,
    })
    expect(getUniqueHooks(smallerPages.pages).map((hook) => hook.id)).toEqual(
      result.pages[0]!.hooks.map((hook) => hook.id),
    )
  })

  it('retains the normalized request context on every page', async () => {
    const options = hookListInfiniteQueryOptions({
      pageSize: 1,
      chainId: UniverseChainId.Base,
      search: '  ',
      sortField: HookSortField.Tvl,
      sortDirection: OrderDirection.Asc,
      period: '7d',
    })
    const result = await queryClient.fetchInfiniteQuery({ ...options, pages: 2 })
    const expected = {
      ...DEFAULT_HOOK_LIST_OPTIONS,
      chainId: UniverseChainId.Base,
      search: '',
      sortField: HookSortField.Tvl,
      sortDirection: OrderDirection.Asc,
      period: '7d',
    }

    expect(result.pages.map((page) => page.options)).toEqual([expected, expected])
  })

  it('searches name prefixes and full deployment addresses before slicing the first page', async () => {
    const name = await queryClient.fetchInfiniteQuery(hookListInfiniteQueryOptions({ search: '  bUNN  ', pageSize: 1 }))
    const address = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ search: '  0xABCdef123456789012345678901234567890ABcd  ', pageSize: 1 }),
    )
    const missing = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, search: 'not-a-hook' }),
    )
    const substring = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, search: 'unni' }),
    )

    expect(name.pages[0]?.hooks.map((hook) => hook.id)).toEqual(['hk_a93c10'])
    expect(address.pages[0]?.hooks.map((hook) => hook.id)).toEqual(['hk_53d1ca'])
    expect(name.pages[0]?.nextCursor).toBeNull()
    expect(missing.pages[0]).toEqual({
      hooks: [],
      nextCursor: null,
      options: { ...DEFAULT_HOOK_LIST_OPTIONS, chainId: undefined, search: 'not-a-hook' },
    })
    expect(substring.pages[0]).toEqual({
      hooks: [],
      nextCursor: null,
      options: { ...DEFAULT_HOOK_LIST_OPTIONS, chainId: undefined, search: 'unni' },
    })
  })

  it('finds unnamed hooks by complete address only inside the selected network', async () => {
    const search = '0x1111111111111111111111111111111111111111'
    const allNetworks = await queryClient.fetchInfiniteQuery(hookListInfiniteQueryOptions({ pageSize: 100, search }))
    const arbitrum = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, search, chainId: UniverseChainId.ArbitrumOne }),
    )
    const base = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, search, chainId: UniverseChainId.Base }),
    )
    const partialAddress = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, search: '0x1111' }),
    )

    expect(allNetworks.pages[0]?.hooks.map((hook) => hook.id)).toEqual(['hk_7b8a2e', 'hk_f03d72'])
    expect(arbitrum.pages[0]?.hooks).toEqual([HOOK_FIXTURES.find((hook) => hook.id === 'hk_f03d72')])
    expect(base.pages[0]?.hooks).toEqual([])
    expect(partialAddress.pages[0]?.hooks).toEqual([])
  })

  it('filters the complete collection before slicing and starts a changed filter at its first cursor', async () => {
    const unfiltered = await queryClient.fetchInfiniteQuery({
      ...hookListInfiniteQueryOptions({ pageSize: 1 }),
      pages: 10,
    })
    const midTvl = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({
        pageSize: 1,
        period: '7d',
        filters: { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
        tvlRange: { min: 100_000, max: 1_000_000 },
      }),
    )
    const routed = await queryClient.fetchInfiniteQuery({
      ...hookListInfiniteQueryOptions({
        pageSize: 1,
        filters: { ...EMPTY_HOOK_FILTER_STATE, routedOnly: true, verifiedSourceOnly: true, metadataOnly: true },
      }),
      pages: 10,
    })

    expect(unfiltered.pages).toHaveLength(7)
    expect(midTvl.pageParams).toEqual([''])
    expect(midTvl.pages[0]?.hooks.map((hook) => hook.id)).toEqual(['hk_86a4c3'])
    expect(midTvl.pages[0]?.nextCursor).toBeNull()
    expect(getUniqueHooks(routed.pages).map((hook) => hook.id)).toEqual(['hk_7b8a2e', 'hk_c51e09'])
    expect(routed.pageParams).toEqual(['', 'hk_7b8a2e'])
    expect(routed.pages.at(-1)?.nextCursor).toBeNull()
    expect(await queryClient.fetchQuery(hookListSummaryQueryOptions())).toEqual(HOOK_LIST_SUMMARY_FIXTURE)
  })

  it('recovers from an empty advanced filter without retaining its cursor or altering the summary', async () => {
    const empty = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({
        pageSize: 100,
        filters: { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
        tvlRange: { max: 100_000 },
      }),
    )
    const reset = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, filters: EMPTY_HOOK_FILTER_STATE }),
    )
    const exactFiltered = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({
        pageSize: 100,
        search: '0x1111111111111111111111111111111111111111',
        chainId: UniverseChainId.ArbitrumOne,
        filters: { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
      }),
    )

    expect(empty.pages).toEqual([
      {
        hooks: [],
        nextCursor: null,
        options: {
          ...DEFAULT_HOOK_LIST_OPTIONS,
          chainId: undefined,
          filters: { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
          tvlRange: { max: 100_000 },
        },
      },
    ])
    expect(reset.pageParams).toEqual([''])
    expect(reset.pages[0]?.hooks.map((hook) => hook.id)).toEqual([
      'hk_7b8a2e',
      'hk_c51e09',
      'hk_53d1ca',
      'hk_86a4c3',
      'hk_f03d72',
      'hk_2d15bf',
      'hk_a93c10',
    ])
    expect(reset.pages[0]?.hooks[0]?.id).toBe('hk_7b8a2e')
    expect(exactFiltered.pages[0]).toEqual({
      hooks: [],
      nextCursor: null,
      options: {
        ...DEFAULT_HOOK_LIST_OPTIONS,
        chainId: UniverseChainId.ArbitrumOne,
        search: '0x1111111111111111111111111111111111111111',
        filters: { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true },
      },
    })
  })

  it('changes volume order with the selected period and starts each new context at its initial cursor', async () => {
    const dayOptions = hookListInfiniteQueryOptions({ pageSize: 1 })
    const day = await queryClient.fetchInfiniteQuery({ ...dayOptions, pages: 10 })
    const weekOptions = hookListInfiniteQueryOptions({ period: '7d', pageSize: 1 })
    const week = await queryClient.fetchInfiniteQuery({ ...weekOptions, pages: 10 })
    const ascending = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, sortDirection: OrderDirection.Asc }),
    )

    expect(
      getUniqueHooks(day.pages)
        .slice(2, 4)
        .map((hook) => hook.id),
    ).toEqual(['hk_53d1ca', 'hk_86a4c3'])
    expect(
      getUniqueHooks(week.pages)
        .slice(2, 4)
        .map((hook) => hook.id),
    ).toEqual(['hk_86a4c3', 'hk_53d1ca'])
    expect(day.pageParams[0]).toBe('')
    expect(week.pageParams[0]).toBe('')
    expect(ascending.pageParams).toEqual([''])
    expect(ascending.pages[0]?.hooks.map((hook) => hook.id)).toEqual([
      'hk_53d1ca',
      'hk_c51e09',
      'hk_7b8a2e',
      'hk_86a4c3',
      'hk_f03d72',
      'hk_2d15bf',
      'hk_a93c10',
    ])
  })

  it('keeps authored global summaries unchanged across pages instead of totaling loaded rows', async () => {
    const result = await queryClient.fetchInfiniteQuery({ ...hookListInfiniteQueryOptions({ pageSize: 2 }), pages: 10 })

    const summary = await queryClient.fetchQuery(hookListSummaryQueryOptions())
    expect(summary).toEqual({
      totalHooks: 7,
      volumeAllTimeUsd: 4_300_640_000,
      tvlUsd: 990_260_000,
    })
    expect(result.pages[0]?.hooks).toHaveLength(2)
    for (const page of result.pages) {
      expect(page).not.toHaveProperty('summary')
    }
  })

  it('keeps authored all-time global summaries fixed across search, sort and table period changes', async () => {
    const result = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({
        pageSize: 100,
        search: 'Angstrom',
        chainId: UniverseChainId.Base,
        period: '30d',
        sortField: HookSortField.Tvl,
        sortDirection: OrderDirection.Asc,
      }),
    )

    expect(await queryClient.fetchQuery(hookListSummaryQueryOptions())).toEqual(HOOK_LIST_SUMMARY_FIXTURE)
    expect(result.pages[0]?.hooks[0]?.metrics.volumeUsd['30d']).toBe(102_300_000)
  })

  it('caches the all-network summary separately from every list context', async () => {
    const fetchSummary = vi.fn(() => HOOK_LIST_SUMMARY_FIXTURE)
    const options = { ...hookListSummaryQueryOptions(), queryFn: fetchSummary }
    expect(options.queryKey).toEqual([
      ReactQueryCacheKey.Hooks,
      'fixture',
      'list-summary',
      { scenario: HooksFixtureScenario.Default },
    ])
    expect(options.queryKey).not.toEqual(hookListInfiniteQueryOptions({ pageSize: 100 }).queryKey)
    expect(options.queryKey).not.toEqual(hookListSummaryQueryOptions({ scenario: HooksFixtureScenario.Empty }).queryKey)

    const summary = await queryClient.fetchQuery(options)
    await queryClient.fetchInfiniteQuery(hookListInfiniteQueryOptions({ pageSize: 100, chainId: UniverseChainId.Base }))
    await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, search: 'stable', period: '30d', sortField: HookSortField.Tvl }),
    )

    expect(await queryClient.fetchQuery(options)).toBe(summary)
    expect(fetchSummary).toHaveBeenCalledTimes(1)
    expect(summary).toEqual(HOOK_LIST_SUMMARY_FIXTURE)
  })

  it('surfaces summary errors without replacing them with successful list data', async () => {
    await queryClient.fetchInfiniteQuery(hookListInfiniteQueryOptions({ pageSize: 100 }))
    const options = hookListSummaryQueryOptions({ scenario: HooksFixtureScenario.Error })

    await expect(queryClient.fetchQuery(options)).rejects.toThrow('Hooks preview request failed')
    expect(queryClient.getQueryState(options.queryKey)?.status).toBe('error')
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined()
  })

  it('keeps summary loading cancellable independently of the list', async () => {
    await queryClient.fetchInfiniteQuery(hookListInfiniteQueryOptions({ pageSize: 100 }))
    const options = hookListSummaryQueryOptions({ scenario: HooksFixtureScenario.Loading })
    const request = Promise.allSettled([queryClient.fetchQuery(options)])

    await Promise.resolve()
    expect(queryClient.getQueryState(options.queryKey)).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })
    await queryClient.cancelQueries({ queryKey: options.queryKey })
    expect(await request).toMatchObject([{ status: 'rejected' }])
    expect(queryClient.getQueryState(hookListInfiniteQueryOptions({ pageSize: 100 }).queryKey)?.status).toBe('success')
  })

  it('scopes group metrics and identity to the requested deployment without mutating the all-chain fixture', async () => {
    const result = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, chainId: UniverseChainId.Base }),
    )
    const angstrom = result.pages[0]?.hooks.find((hook) => hook.id === 'hk_7b8a2e')

    expect(angstrom).toMatchObject({
      id: 'hk_7b8a2e',
      metrics: { volumeUsd: { '1d': 4_100_000 }, tvlUsd: 10_500_000, poolCount: 12 },
    })
    expect(angstrom?.deployments).toHaveLength(1)
    expect(angstrom?.deployments[0]).toMatchObject({
      chainId: UniverseChainId.Base,
      address: '0x2222222222222222222222222222222222222222',
    })
    expect(await queryClient.fetchQuery(hookListSummaryQueryOptions())).toEqual(HOOK_LIST_SUMMARY_FIXTURE)
    for (const hook of result.pages[0]?.hooks ?? []) {
      expect(hook.deployments.map((deployment) => deployment.chainId)).toEqual([UniverseChainId.Base])
    }
    expect(HOOK_FIXTURES[0]?.deployments).toHaveLength(2)
    expect(HOOK_FIXTURES[0]?.metrics.volumeUsd['1d']).toBe(14_200_000)
  })

  it('keeps the global summary for zero-activity networks and networks without fixture deployments', async () => {
    const zero = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, chainId: UniverseChainId.ArbitrumOne }),
    )
    const empty = await queryClient.fetchInfiniteQuery(
      hookListInfiniteQueryOptions({ pageSize: 100, chainId: UniverseChainId.Polygon }),
    )

    expect(await queryClient.fetchQuery(hookListSummaryQueryOptions())).toEqual(HOOK_LIST_SUMMARY_FIXTURE)
    expect(zero.pages[0]?.hooks).toEqual([HOOK_FIXTURES.find((hook) => hook.id === 'hk_f03d72')])
    expect(empty.pages[0]).toEqual({
      hooks: [],
      nextCursor: null,
      options: { ...DEFAULT_HOOK_LIST_OPTIONS, chainId: UniverseChainId.Polygon },
    })
  })

  it('deduplicates overlapping pages by opaque group ID, preserving first-seen values and order', async () => {
    const result = await queryClient.fetchInfiniteQuery({ ...hookListInfiniteQueryOptions({ pageSize: 2 }), pages: 10 })
    const firstPage = result.pages[0]!
    const original = firstPage.hooks[0]!
    const duplicatePage = { ...firstPage, hooks: [{ ...original, name: 'Later duplicate' }] }
    const hooks = getUniqueHooks([firstPage, duplicatePage, ...result.pages.slice(1)])

    expect(hooks).toEqual(getUniqueHooks(result.pages))
    expect(hooks[0]).toBe(original)
    expect(hooks.filter((hook) => hook.id === original.id)).toHaveLength(1)
    expect(
      hooks.filter((hook) => hook.deployments[0].address === original.deployments[0].address).map((hook) => hook.id),
    ).toEqual(['hk_7b8a2e', 'hk_f03d72'])
  })

  it('rejects an unknown cursor instead of silently repeating the first page', async () => {
    const options = hookListInfiniteQueryOptions({ pageSize: 100 })
    await expect(queryClient.fetchInfiniteQuery({ ...options, initialPageParam: 'missing-group' })).rejects.toThrow(
      'Unknown Hooks fixture cursor',
    )
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined()
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid page size %s', (pageSize) => {
    expect(() => hookListInfiniteQueryOptions({ pageSize })).toThrow('Hooks page size must be a positive integer')
  })

  it.each([HooksFixtureScenario.Empty, HooksFixtureScenario.NotFound])(
    'returns explicit %s without substituting another hook or global summary',
    async (scenario) => {
      const result = await queryClient.fetchInfiniteQuery(hookListInfiniteQueryOptions({ pageSize: 100, scenario }))
      expect(result.pages).toEqual([
        { hooks: [], nextCursor: null, options: { ...DEFAULT_HOOK_LIST_OPTIONS, chainId: undefined } },
      ])
      expect(await queryClient.fetchQuery(hookListSummaryQueryOptions({ scenario }))).toEqual(
        EMPTY_HOOK_LIST_SUMMARY_FIXTURE,
      )
    },
  )

  it('surfaces the error scenario without falling back to fixture success', async () => {
    const options = hookListInfiniteQueryOptions({ pageSize: 100, scenario: HooksFixtureScenario.Error })
    await expect(queryClient.fetchInfiniteQuery(options)).rejects.toThrow('Hooks preview request failed')
    expect(queryClient.getQueryState(options.queryKey)?.status).toBe('error')
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined()
  })

  it('keeps the loading scenario pending until the query is cancelled', async () => {
    const options = hookListInfiniteQueryOptions({ pageSize: 100, scenario: HooksFixtureScenario.Loading })
    const request = Promise.allSettled([queryClient.fetchInfiniteQuery(options)])

    await Promise.resolve()
    expect(queryClient.getQueryState(options.queryKey)).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })

    await queryClient.cancelQueries({ queryKey: options.queryKey })
    expect(await request).toMatchObject([{ status: 'rejected' }])
    expect(queryClient.getQueryState(options.queryKey)?.fetchStatus).toBe('idle')
  })
})

describe('Hook detail fixture queries', () => {
  const mainnetAddress = '0x1111111111111111111111111111111111111111'
  const baseAddress = '0x2222222222222222222222222222222222222222'

  it('returns selected deployment metrics with only its authored group’s deployment addresses', async () => {
    const detail = await queryClient.fetchQuery(
      hookDetailQueryOptions({
        chainId: UniverseChainId.Base,
        hookAddress: baseAddress,
      }),
    )

    expect(detail).toMatchObject({
      id: 'hk_7b8a2e',
      name: 'Angstrom',
      descriptionGeneratedByAi: false,
      isFixture: true,
      deployment: {
        chainId: UniverseChainId.Base,
        address: baseAddress,
        metrics: { tvlUsd: 10_500_000, volumeAllTimeUsd: 300_000_000, feesAllTimeUsd: 820_000 },
        isFixture: true,
      },
    })
    expect(detail).not.toHaveProperty('metrics')
    expect(detail?.deployments).toEqual([
      {
        chainId: UniverseChainId.Mainnet,
        address: mainnetAddress,
        deployerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
      {
        chainId: UniverseChainId.Base,
        address: baseAddress,
        deployerAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
    ])
    expect(detail?.deployment.metrics).not.toEqual(HOOK_FIXTURES[0]?.metrics)
  })

  it('keeps the same address on different chains in its own group and cache entry', async () => {
    const mainnet = hookDetailQueryOptions({ chainId: UniverseChainId.Mainnet, hookAddress: mainnetAddress })
    const arbitrum = hookDetailQueryOptions({ chainId: UniverseChainId.ArbitrumOne, hookAddress: mainnetAddress })

    expect(mainnet.queryKey).not.toEqual(arbitrum.queryKey)
    expect(await queryClient.fetchQuery(mainnet)).toMatchObject({ id: 'hk_7b8a2e', name: 'Angstrom' })
    expect(await queryClient.fetchQuery(arbitrum)).toMatchObject({ id: 'hk_f03d72', name: null, description: '' })
    expect((await queryClient.fetchQuery(arbitrum))?.deployments).toEqual([
      { chainId: UniverseChainId.ArbitrumOne, address: mainnetAddress, deployerAddress: null },
    ])
  })

  it('reuses the normalized identity cache while isolating list, address and scenario entries', async () => {
    const hookAddress = '0xABCdef123456789012345678901234567890ABcd'
    const mixedCase = hookDetailQueryOptions({ chainId: UniverseChainId.Optimism, hookAddress })
    const canonical = hookDetailQueryOptions({
      chainId: UniverseChainId.Optimism,
      hookAddress: '0xabcdef123456789012345678901234567890abcd',
    })

    expect(mixedCase.queryKey).toEqual(canonical.queryKey)
    expect(mixedCase.queryKey).not.toEqual(hookListInfiniteQueryOptions({ pageSize: 100 }).queryKey)
    expect(mixedCase.queryKey).not.toEqual(
      hookDetailQueryOptions({
        chainId: UniverseChainId.Optimism,
        hookAddress: mainnetAddress,
      }).queryKey,
    )
    expect(mixedCase.queryKey).not.toEqual(
      hookDetailQueryOptions({
        chainId: UniverseChainId.Optimism,
        hookAddress,
        scenario: HooksFixtureScenario.NotFound,
      }).queryKey,
    )
    const detail = await queryClient.fetchQuery(mixedCase)
    expect(detail?.deployment.address).toBe('0xabcdef123456789012345678901234567890abcd')
    expect(await queryClient.fetchQuery(canonical)).toBe(detail)
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
  })

  it.each([
    { chainId: UniverseChainId.Base, hookAddress: mainnetAddress },
    { chainId: UniverseChainId.Mainnet, hookAddress: '0x9999999999999999999999999999999999999999' },
  ])('returns not found for a hook absent on $chainId at $hookAddress', async (identity) => {
    expect(await queryClient.fetchQuery(hookDetailQueryOptions(identity))).toBeNull()
  })

  it.each([HooksFixtureScenario.Empty, HooksFixtureScenario.NotFound])(
    'returns no substitute hook for the %s scenario',
    async (scenario) => {
      expect(
        await queryClient.fetchQuery(
          hookDetailQueryOptions({
            chainId: UniverseChainId.Mainnet,
            hookAddress: mainnetAddress,
            scenario,
          }),
        ),
      ).toBeNull()
    },
  )

  it('keeps zero activity and inactive permissions distinct from unavailable data', async () => {
    const zero = await queryClient.fetchQuery(
      hookDetailQueryOptions({
        chainId: UniverseChainId.ArbitrumOne,
        hookAddress: mainnetAddress,
      }),
    )
    const unavailable = await queryClient.fetchQuery(
      hookDetailQueryOptions({
        chainId: UniverseChainId.Base,
        hookAddress: '0x4444444444444444444444444444444444444444',
      }),
    )

    expect(zero?.deployment.metrics).toMatchObject({ volumeAllTimeUsd: 0, feesAllTimeUsd: 0, tvlUsd: 0 })
    expect(unavailable?.deployment.metrics).toMatchObject({
      volumeAllTimeUsd: null,
      feesAllTimeUsd: null,
      tvlUsd: null,
    })
    expect(zero).not.toBeNull()
    expect(unavailable).not.toBeNull()
  })

  it('keeps a sibling placeholder without showing another hook or an address from a different network', async () => {
    const previous = await queryClient.fetchQuery(
      hookDetailQueryOptions({ chainId: UniverseChainId.Mainnet, hookAddress: mainnetAddress }),
    )
    const options = hookDetailQueryOptions({ chainId: UniverseChainId.Base, hookAddress: baseAddress })
    if (typeof options.placeholderData !== 'function') {
      throw new Error('Expected a sibling placeholder function')
    }
    expect(options.placeholderData(previous, undefined)).toBe(previous)
    expect(options.placeholderData(undefined, undefined)).toBeUndefined()

    const otherHook = await queryClient.fetchQuery(
      hookDetailQueryOptions({ chainId: UniverseChainId.ArbitrumOne, hookAddress: mainnetAddress }),
    )
    expect(options.placeholderData(otherHook, undefined)).toBeUndefined()

    const sameAddressOnAnotherNetwork = hookDetailQueryOptions({
      chainId: UniverseChainId.ArbitrumOne,
      hookAddress: mainnetAddress,
    })
    if (typeof sameAddressOnAnotherNetwork.placeholderData !== 'function') {
      throw new Error('Expected a sibling placeholder function')
    }
    expect(sameAddressOnAnotherNetwork.placeholderData(previous, undefined)).toBeUndefined()
  })

  it('surfaces a detail error without reusing a successful identity or substituting fixtures', async () => {
    const identity = { chainId: UniverseChainId.Mainnet, hookAddress: mainnetAddress }
    await queryClient.fetchQuery(hookDetailQueryOptions(identity))
    const options = hookDetailQueryOptions({ ...identity, scenario: HooksFixtureScenario.Error })

    await expect(queryClient.fetchQuery(options)).rejects.toThrow('Hooks preview request failed')
    expect(queryClient.getQueryState(options.queryKey)?.status).toBe('error')
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined()
  })

  it('keeps detail loading cancellable without exposing another cached deployment', async () => {
    await queryClient.fetchQuery(
      hookDetailQueryOptions({ chainId: UniverseChainId.Mainnet, hookAddress: mainnetAddress }),
    )
    const options = hookDetailQueryOptions({
      chainId: UniverseChainId.Base,
      hookAddress: baseAddress,
      scenario: HooksFixtureScenario.Loading,
    })
    const request = Promise.allSettled([queryClient.fetchQuery(options)])

    await Promise.resolve()
    expect(queryClient.getQueryState(options.queryKey)).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      data: undefined,
    })
    await queryClient.cancelQueries({ queryKey: options.queryKey })
    expect(await request).toMatchObject([{ status: 'rejected' }])
    expect(queryClient.getQueryState(options.queryKey)?.fetchStatus).toBe('idle')
  })
})

describe('Hooks fixture model', () => {
  it.each(Object.values(HooksFixtureScenario))('parses the %s scenario', (scenario) => {
    expect(parseHooksFixtureScenario(scenario)).toBe(scenario)
  })

  it.each([null, '', 'unknown', 'Loading'])('defaults an unsupported scenario %s', (value) => {
    expect(parseHooksFixtureScenario(value)).toBe(HooksFixtureScenario.Default)
  })

  it('identifies deployments by numeric chain and normalized address while preserving opaque groups', () => {
    const address = '0xABCdef123456789012345678901234567890ABcd'
    const mainnetKey = getHookDeploymentKey({ chainId: UniverseChainId.Mainnet, address })
    expect(mainnetKey).toBe(`1-${address.toLowerCase()}`)
    expect(mainnetKey).toBe(getHookDeploymentKey({ chainId: UniverseChainId.Mainnet, address: address.toLowerCase() }))
    expect(mainnetKey).not.toBe(getHookDeploymentKey({ chainId: UniverseChainId.Base, address }))

    const multiChainHook = HOOK_FIXTURES.find((hook) => hook.deployments.length > 1)
    expect(multiChainHook).toBeDefined()
    expect(new Set(multiChainHook?.deployments.map((deployment) => deployment.address)).size).toBeGreaterThan(1)

    const matchingAddressGroups = HOOK_FIXTURES.filter((hook) =>
      hook.deployments.some((deployment) => deployment.address === HOOK_FIXTURES[0]?.deployments[0].address),
    )
    expect(matchingAddressGroups).toHaveLength(2)
    expect(new Set(matchingAddressGroups.map((hook) => hook.id)).size).toBe(2)
    const deploymentKeys = HOOK_FIXTURES.flatMap((hook) => hook.deployments.map(getHookDeploymentKey))
    expect(new Set(deploymentKeys).size).toBe(deploymentKeys.length)
    expect(HOOK_FIXTURES.every((hook) => !deploymentKeys.includes(hook.id))).toBe(true)
  })

  it('marks every synthetic group and deployment as a fixture', () => {
    expect(HOOK_FIXTURES.every((hook) => hook.isFixture)).toBe(true)
    expect(HOOK_FIXTURES.flatMap((hook) => hook.deployments).every((deployment) => deployment.isFixture)).toBe(true)
  })

  it('preserves verified unnamed hooks and separates source verification, routing and provenance', () => {
    const verifiedUnnamed = HOOK_FIXTURES.find(
      (hook) =>
        hook.name === null && hook.deployments.some((deployment) => deployment.sourceVerification === 'verified'),
    )
    expect(verifiedUnnamed).toBeDefined()
    expect(verifiedUnnamed?.deployments[0]).toMatchObject({
      sourceVerification: 'verified',
      routingStatus: 'unknown',
      provenance: { builder: null, configurer: null },
    })

    const built = HOOK_FIXTURES.flatMap((hook) => hook.deployments).find(
      (deployment) => deployment.provenance.builder?.name === 'Uniswap Labs',
    )
    const configured = HOOK_FIXTURES.flatMap((hook) => hook.deployments).find(
      (deployment) => deployment.provenance.configurer?.name === 'Uniswap Labs',
    )
    expect(built?.provenance.configurer).toEqual({ name: 'Ondo' })
    expect(configured).toMatchObject({
      sourceVerification: 'unverified',
      routingStatus: 'unsupported',
      provenance: { builder: { name: 'Independent builder' }, configurer: { name: 'Uniswap Labs' } },
    })
  })

  it('distinguishes zero pools and zero metrics from unavailable and partially indexed analytics', () => {
    const zero = HOOK_FIXTURES.find((hook) => hook.metrics.poolCount === 0)
    const unavailable = HOOK_FIXTURES.find((hook) => hook.metrics.poolCount === null)
    const partial = HOOK_FIXTURES.find((hook) =>
      hook.deployments.some((deployment) => deployment.indexing === 'partial'),
    )

    expect(zero?.metrics).toEqual({
      volumeUsd: { '1d': 0, '7d': 0, '30d': 0 },
      volumeAllTimeUsd: 0,
      tvlUsd: 0,
      feesAllTimeUsd: 0,
      poolCount: 0,
    })
    expect(unavailable?.metrics).toEqual({
      volumeUsd: { '1d': null, '7d': null, '30d': null },
      volumeAllTimeUsd: null,
      tvlUsd: null,
      feesAllTimeUsd: null,
      poolCount: null,
    })
    expect(partial?.deployments[0]).toMatchObject({ accounting: 'custom', indexing: 'partial' })
    expect(partial?.metrics.volumeUsd['1d']).toBeGreaterThan(0)
    expect(partial?.metrics.volumeUsd['30d']).toBeNull()
    expect(HOOK_FIXTURES[0]?.metrics).not.toEqual(HOOK_FIXTURES[0]?.deployments[0].metrics)
  })

  it('keeps description absence and AI origin explicit rather than inferring either from a name', () => {
    const noMetadata = HOOK_FIXTURES.find((hook) => hook.id === 'hk_f03d72')
    const aiDescription = HOOK_FIXTURES.find((hook) => hook.name === 'StablePairHook')
    const registryDescription = HOOK_FIXTURES.find((hook) => hook.name === 'Angstrom')

    expect(noMetadata).toMatchObject({
      name: null,
      hasMetadata: false,
      description: '',
      descriptionGeneratedByAi: false,
    })
    expect(HOOK_FIXTURES.find((hook) => hook.id === 'hk_2d15bf')).toMatchObject({
      name: null,
      hasMetadata: false,
      description: '',
    })
    expect(aiDescription?.descriptionGeneratedByAi).toBe(true)
    expect(aiDescription?.description).not.toBe('')
    expect(registryDescription?.descriptionGeneratedByAi).toBe(false)
    expect(registryDescription?.description).not.toBe('')
  })

  it('provides explicit fixture provenance variants independently of source verification and routing', () => {
    const deployments = HOOK_FIXTURES.flatMap((hook) => hook.deployments)
    const kinds = deployments.flatMap((deployment) =>
      deployment.fixtureProvenance ? [deployment.fixtureProvenance.kind] : [],
    )

    expect(new Set(kinds)).toEqual(new Set(Object.values(UniswapHookProvenance)))
    expect(
      deployments.find((deployment) => deployment.fixtureProvenance?.kind === UniswapHookProvenance.Configured),
    ).toMatchObject({
      sourceVerification: 'unverified',
      routingStatus: 'unsupported',
      fixtureProvenance: { kind: UniswapHookProvenance.Configured, partnerName: 'Independent builder' },
    })
    expect(
      deployments.find((deployment) => deployment.address === '0x1111111111111111111111111111111111111111')
        ?.fixtureProvenance,
    ).toBeNull()
  })

  it('covers partial indexing separately from custom accounting with usable long metadata', () => {
    const partial = HOOK_FIXTURES.find((hook) => hook.id === 'hk_53d1ca')

    expect(partial?.deployments[0]).toMatchObject({
      accounting: 'standard',
      indexing: 'partial',
      metrics: { volumeAllTimeUsd: null, feesAllTimeUsd: null, tvlUsd: 1_240_000 },
    })
    expect(partial?.name?.length).toBeGreaterThan(60)
    expect(partial?.description.length).toBeGreaterThan(250)
  })
})

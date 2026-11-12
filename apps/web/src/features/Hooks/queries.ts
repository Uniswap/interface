import { type InfiniteData, infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { UniverseChainId } from '@universe/chains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { InfiniteQueryOptionsResult, QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { EMPTY_HOOK_LIST_SUMMARY_FIXTURE, HOOK_FIXTURES, HOOK_LIST_SUMMARY_FIXTURE } from '~/features/Hooks/fixtures'
import { getRankedHookFixtures } from '~/features/Hooks/getRankedHookFixtures'
import { DEFAULT_HOOK_LIST_OPTIONS, type HookListOptions } from '~/features/Hooks/hookListOptions'
import { normalizeHookSearch } from '~/features/Hooks/hookSearch'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import {
  type Hook,
  type HookDetail,
  type HookListPage,
  type HookListSummary,
  HooksFixtureScenario,
} from '~/features/Hooks/types'

async function applyFixtureScenario(scenario: HooksFixtureScenario, signal: AbortSignal): Promise<void> {
  if (scenario === HooksFixtureScenario.Error) {
    throw new Error('Hooks preview request failed')
  }
  if (scenario === HooksFixtureScenario.Loading) {
    await new Promise<void>((_resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason)
        return
      }
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
  }
}

export function getUniqueHooks(pages: readonly HookListPage[]): Hook[] {
  const hooks = new Map<string, Hook>()
  for (const page of pages) {
    for (const hook of page.hooks) {
      if (!hooks.has(hook.id)) {
        hooks.set(hook.id, hook)
      }
    }
  }
  return [...hooks.values()]
}

type HookListQueryKey = readonly [
  ReactQueryCacheKey.Hooks,
  'fixture',
  'infinite-list',
  HookListOptions & {
    scenario: HooksFixtureScenario
    chainId: UniverseChainId | undefined
    pageSize: number
  },
]

// TODO(CONS-3940): Replace the fixture list and totals queries with the data-api endpoints and move fixtures into tests.
export function hookListSummaryQueryOptions({
  scenario = HooksFixtureScenario.Default,
}: {
  scenario?: HooksFixtureScenario
} = {}): QueryOptionsResult<HookListSummary> {
  return queryOptions<HookListSummary>({
    queryKey: [ReactQueryCacheKey.Hooks, 'fixture', 'list-summary', { scenario }],
    queryFn: async ({ signal }): Promise<HookListSummary> => {
      await applyFixtureScenario(scenario, signal)
      return scenario === HooksFixtureScenario.Empty || scenario === HooksFixtureScenario.NotFound
        ? EMPTY_HOOK_LIST_SUMMARY_FIXTURE
        : HOOK_LIST_SUMMARY_FIXTURE
    },
    retry: false,
    staleTime: Infinity,
  })
}

export function hookListInfiniteQueryOptions({
  scenario = HooksFixtureScenario.Default,
  chainId,
  pageSize,
  search = DEFAULT_HOOK_LIST_OPTIONS.search,
  filters = DEFAULT_HOOK_LIST_OPTIONS.filters,
  tvlRange,
  sortField = DEFAULT_HOOK_LIST_OPTIONS.sortField,
  sortDirection = DEFAULT_HOOK_LIST_OPTIONS.sortDirection,
  period = DEFAULT_HOOK_LIST_OPTIONS.period,
}: {
  scenario?: HooksFixtureScenario
  chainId?: UniverseChainId
  pageSize: number
} & Partial<HookListOptions>): InfiniteQueryOptionsResult<
  HookListPage,
  Error,
  InfiniteData<HookListPage>,
  HookListQueryKey,
  string
> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('Hooks page size must be a positive integer')
  }
  const normalizedSearch = normalizeHookSearch(search)
  const options: HookListPage['options'] = {
    chainId,
    search: normalizedSearch,
    filters,
    tvlRange,
    sortField,
    sortDirection,
    period,
  }

  return infiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.Hooks, 'fixture', 'infinite-list', { scenario, pageSize, ...options }] as const,
    queryFn: async ({ signal, pageParam }): Promise<HookListPage> => {
      await applyFixtureScenario(scenario, signal)
      const isEmpty = scenario === HooksFixtureScenario.Empty || scenario === HooksFixtureScenario.NotFound
      const hooks = isEmpty
        ? []
        : getRankedHookFixtures({
            fixtures: HOOK_FIXTURES,
            ...options,
          })
      const cursorIndex = pageParam ? hooks.findIndex((hook) => hook.id === pageParam) : -1
      if (pageParam && cursorIndex === -1) {
        throw new Error('Unknown Hooks fixture cursor')
      }
      const start = cursorIndex + 1
      const pageHooks = hooks.slice(start, start + pageSize)
      return {
        hooks: pageHooks,
        nextCursor: start + pageSize < hooks.length ? (pageHooks.at(-1)?.id ?? null) : null,
        options,
      }
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    // Returning to an inactive filter context starts from its first page.
    gcTime: 0,
    retry: false,
    staleTime: Infinity,
  })
}

// TODO(CONS-3941): Replace the fixture detail lookup with the deployed data-api endpoint.
export function hookDetailQueryOptions({
  chainId,
  hookAddress,
  scenario = HooksFixtureScenario.Default,
}: {
  chainId: UniverseChainId
  hookAddress: string
  scenario?: HooksFixtureScenario
}): QueryOptionsResult<HookDetail | null> {
  const deploymentKey = getHookDeploymentKey({ chainId, address: hookAddress })

  return queryOptions<HookDetail | null>({
    placeholderData: (previous) =>
      previous?.deployments.some((deployment) => getHookDeploymentKey(deployment) === deploymentKey)
        ? previous
        : undefined,
    queryKey: [ReactQueryCacheKey.Hooks, 'fixture', 'detail', { deploymentKey, scenario }],
    queryFn: async ({ signal }): Promise<HookDetail | null> => {
      await applyFixtureScenario(scenario, signal)
      if (scenario === HooksFixtureScenario.Empty || scenario === HooksFixtureScenario.NotFound) {
        return null
      }

      for (const hook of HOOK_FIXTURES) {
        const deployment = hook.deployments.find((candidate) => getHookDeploymentKey(candidate) === deploymentKey)
        if (deployment) {
          return {
            id: hook.id,
            name: hook.name,
            description: hook.description,
            descriptionGeneratedByAi: hook.descriptionGeneratedByAi,
            isFixture: hook.isFixture,
            deployment,
            deployments: hook.deployments.map((sibling) => ({
              chainId: sibling.chainId,
              address: sibling.address,
              deployerAddress: sibling.deployerAddress,
            })),
          }
        }
      }
      return null
    },
    retry: false,
    staleTime: Infinity,
  })
}

import { queryOptions } from '@tanstack/react-query'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { HOOK_FIXTURES } from '~/features/Hooks/fixtures'
import { type HookListPage, HooksFixtureScenario } from '~/features/Hooks/types'

export const HOOKS_PAGE_SIZE = 5

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

// TODO(CONS-3940): Replace the fixture list query with the data-api endpoint and move fixtures into tests.
export function hookListQueryOptions({
  scenario = HooksFixtureScenario.Default,
  page = 1,
  pageSize = HOOKS_PAGE_SIZE,
}: {
  scenario?: HooksFixtureScenario
  page?: number
  pageSize?: number
} = {}): QueryOptionsResult<HookListPage> {
  return queryOptions<HookListPage>({
    queryKey: [ReactQueryCacheKey.Hooks, 'fixture', 'list', { scenario, page, pageSize }],
    queryFn: async ({ signal }): Promise<HookListPage> => {
      await applyFixtureScenario(scenario, signal)
      const hooks =
        scenario === HooksFixtureScenario.Empty || scenario === HooksFixtureScenario.NotFound ? [] : HOOK_FIXTURES
      const start = (page - 1) * pageSize
      return {
        hooks: hooks.slice(start, start + pageSize),
        totalCount: hooks.length,
        nextPage: start + pageSize < hooks.length ? page + 1 : null,
      }
    },
    retry: false,
    staleTime: Infinity,
  })
}

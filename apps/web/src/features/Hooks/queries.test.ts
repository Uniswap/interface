import { QueryClient } from '@tanstack/react-query'
import { UniverseChainId } from '@universe/chains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { afterEach, describe, expect, it } from 'vitest'
import { HOOK_FIXTURES, parseHooksFixtureScenario } from '~/features/Hooks/fixtures'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import { HOOKS_PAGE_SIZE, hookListQueryOptions } from '~/features/Hooks/queries'
import { type Hook, type HookListPage, HooksFixtureScenario } from '~/features/Hooks/types'

const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })

afterEach(() => {
  queryClient.clear()
})

describe('Hooks fixture queries', () => {
  it('isolates fixture queries and distinguishes scenario and pagination cache entries', () => {
    const list = hookListQueryOptions()
    expect(list.queryKey[0]).toBe(ReactQueryCacheKey.Hooks)
    expect(list.queryKey).toContain('fixture')
    expect(list.queryKey).not.toEqual(hookListQueryOptions({ scenario: HooksFixtureScenario.Empty }).queryKey)
    expect(list.queryKey).not.toEqual(hookListQueryOptions({ page: 2 }).queryKey)
    expect(list.queryKey).not.toEqual(hookListQueryOptions({ pageSize: 2 }).queryKey)
  })

  it('paginates the full fixture corpus in stable order without dropping or repeating groups', async () => {
    const hooks: Hook[] = []
    let page: number | null = 1

    while (page !== null) {
      const result: HookListPage = await queryClient.fetchQuery(hookListQueryOptions({ page, pageSize: 2 }))
      expect(result.totalCount).toBe(HOOK_FIXTURES.length)
      hooks.push(...result.hooks)
      page = result.nextPage
    }

    expect(hooks.map((hook) => hook.id)).toEqual(HOOK_FIXTURES.map((hook) => hook.id))
    expect(new Set(hooks.map((hook) => hook.id)).size).toBe(HOOK_FIXTURES.length)
    expect(await queryClient.fetchQuery(hookListQueryOptions({ page: 100 }))).toEqual({
      hooks: [],
      totalCount: HOOK_FIXTURES.length,
      nextPage: null,
    })
  })

  it('uses the shared preview page size by default', async () => {
    const result = await queryClient.fetchQuery(hookListQueryOptions())
    expect(result.hooks).toHaveLength(HOOKS_PAGE_SIZE)
    expect(result.nextPage).toBe(2)
  })

  it('returns explicit empty and not-found results without substituting another hook', async () => {
    expect(await queryClient.fetchQuery(hookListQueryOptions({ scenario: HooksFixtureScenario.Empty }))).toEqual({
      hooks: [],
      totalCount: 0,
      nextPage: null,
    })
    expect(await queryClient.fetchQuery(hookListQueryOptions({ scenario: HooksFixtureScenario.NotFound }))).toEqual({
      hooks: [],
      totalCount: 0,
      nextPage: null,
    })
  })

  it('surfaces the error scenario without falling back to fixture success', async () => {
    const options = hookListQueryOptions({ scenario: HooksFixtureScenario.Error })
    await expect(queryClient.fetchQuery(options)).rejects.toThrow('Hooks preview request failed')
    expect(queryClient.getQueryState(options.queryKey)?.status).toBe('error')
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined()
  })

  it('keeps the loading scenario pending until the query is cancelled', async () => {
    const options = hookListQueryOptions({ scenario: HooksFixtureScenario.Loading })
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
    const address = '0xABCdef123456789012345678901234567890ABcdeF'
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
    expect(built?.provenance.configurer).toBeNull()
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
      tvlUsd: 0,
      feesAllTimeUsd: 0,
      poolCount: 0,
    })
    expect(unavailable?.metrics).toEqual({
      volumeUsd: { '1d': null, '7d': null, '30d': null },
      tvlUsd: null,
      feesAllTimeUsd: null,
      poolCount: null,
    })
    expect(partial?.deployments[0]).toMatchObject({ accounting: 'custom', indexing: 'partial' })
    expect(partial?.metrics.volumeUsd['1d']).toBeGreaterThan(0)
    expect(partial?.metrics.volumeUsd['30d']).toBeNull()
    expect(HOOK_FIXTURES[0]?.metrics).not.toEqual(HOOK_FIXTURES[0]?.deployments[0].metrics)
  })
})

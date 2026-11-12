import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query'
import { UniverseChainId } from '@universe/chains'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { afterEach, describe, expect, it } from 'vitest'
import { PoolSortFields } from '~/data/pools/poolStats'
import { TimePeriod } from '~/data/util'
import { HOOK_FIXTURES } from '~/features/Hooks/fixtures'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import { HOOK_POOL_FIXTURES } from '~/features/Hooks/poolFixtures'
import { hookPoolsFixtureQueryOptions } from '~/features/Hooks/poolQueries'

const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
const MAINNET = { chainId: UniverseChainId.Mainnet, hookAddress: '0x1111111111111111111111111111111111111111' }
const BASE = { chainId: UniverseChainId.Base, hookAddress: '0x2222222222222222222222222222222222222222' }
const mainnetId = (index: number): string =>
  `hooks-preview-${MAINNET.chainId}-${MAINNET.hookAddress}-${String(index).padStart(3, '0')}`

afterEach(() => queryClient.clear())

describe('hook pool fixtures', () => {
  it('covers only known deployments and keeps every synthetic pool scoped to its chain and hook', () => {
    const knownDeployments = new Set(HOOK_FIXTURES.flatMap((hook) => hook.deployments.map(getHookDeploymentKey)))
    const fixtureDeployments = HOOK_POOL_FIXTURES.map(({ chainId, hookAddress }) =>
      getHookDeploymentKey({ chainId, address: hookAddress }),
    )
    expect(new Set(fixtureDeployments)).toEqual(knownDeployments)

    for (const fixture of HOOK_POOL_FIXTURES) {
      expect(fixture.pools).toHaveLength(fixture.total)
      const deployment = HOOK_FIXTURES.flatMap((hook) => hook.deployments).find(
        (candidate) =>
          getHookDeploymentKey(candidate) ===
          getHookDeploymentKey({ chainId: fixture.chainId, address: fixture.hookAddress }),
      )
      if (deployment?.metrics.poolCount !== null) {
        expect(fixture.total).toBe(deployment?.metrics.poolCount)
      }
      for (const pool of fixture.pools) {
        expect(pool.chainId).toBe(fixture.chainId)
        expect(pool.hookAddress).toBe(fixture.hookAddress)
        expect(pool.token0?.chainId).toBe(fixture.chainId)
        expect(pool.token1?.chainId).toBe(fixture.chainId)
        expect(pool.id).toMatch(/^hooks-preview-/)
        expect(pool.id).not.toMatch(/^0x[0-9a-f]{64}$/i)
      }
    }
  })

  it('keeps explicit zero observations distinct from unavailable data and invalid ratios', async () => {
    const result = await queryClient.fetchInfiniteQuery({
      ...hookPoolsFixtureQueryOptions({ ...MAINNET, pageSize: 5 }),
      pages: 10,
    })
    const pools = result.pages.flatMap((page) => page.pools)
    const zero = pools.find((pool) => pool.id === mainnetId(6))
    const zeroTvl = pools.find((pool) => pool.id === mainnetId(7))
    const unavailable = pools.find((pool) => pool.id === mainnetId(8))

    expect(zero).toMatchObject({
      totalLiquidity: { value: 0 },
      volume1Day: { value: 0 },
      volume30Day: { value: 0 },
      apr: 0,
    })
    expect(zero?.volOverTvl).toBeUndefined()
    expect(zeroTvl?.volume30Day?.value).toBe(50_000)
    expect(zeroTvl?.volOverTvl).toBeUndefined()
    expect(unavailable?.totalLiquidity).toBeUndefined()
    expect(unavailable?.volume1Day).toBeUndefined()
    expect(unavailable?.volume30Day).toBeUndefined()
    expect(unavailable?.apr).toBeUndefined()
    expect(unavailable?.volOverTvl).toBeUndefined()

    const unavailableDeployment = await queryClient.fetchInfiniteQuery(
      hookPoolsFixtureQueryOptions({
        pageSize: 100,
        ...BASE,
        hookAddress: '0x4444444444444444444444444444444444444444',
      }),
    )
    expect(unavailableDeployment.pages[0]?.pools[0]?.totalLiquidity).toBeUndefined()
    expect(unavailableDeployment.pages[0]?.pools[0]?.volume1Day).toBeUndefined()
  })

  it('carries dynamic fee identity without substituting a fixed fee', async () => {
    const result = await queryClient.fetchInfiniteQuery(hookPoolsFixtureQueryOptions({ ...MAINNET, pageSize: 5 }))
    expect(result.pages[0]?.pools[0]?.feeTier).toMatchObject({ isDynamic: true, feeAmount: DYNAMIC_FEE_AMOUNT })
    expect(result.pages[0]?.pools[1]?.feeTier).toMatchObject({ isDynamic: false, feeAmount: 500 })
  })
})

describe('hookPoolsFixtureQueryOptions', () => {
  it('keeps resolved rows through period changes without carrying them into a newly mounted deployment', async () => {
    const observer = new InfiniteQueryObserver(queryClient, hookPoolsFixtureQueryOptions({ ...MAINNET, pageSize: 5 }))
    const unsubscribe = observer.subscribe(() => {})
    await observer.refetch()
    const previous = observer.getCurrentResult().data
    expect(previous?.pages[0]?.pools.map((pool) => pool.id)).toEqual([1, 2, 9, 17, 10].map(mainnetId))
    const replacement = { pools: [HOOK_POOL_FIXTURES[0]!.pools[0]!], total: 24, nextCursor: null }
    let resolveNext: (value: typeof replacement) => void = () => {
      throw new Error('The replacement request has not started')
    }
    const request = new Promise<typeof replacement>((resolve) => {
      resolveNext = resolve
    })

    observer.setOptions({
      ...hookPoolsFixtureQueryOptions({ pageSize: 100, ...MAINNET, period: TimePeriod.MONTH }),
      queryFn: () => request,
    })

    expect(observer.getCurrentResult()).toMatchObject({
      isFetching: true,
      isLoading: false,
      isPlaceholderData: true,
    })
    expect(observer.getCurrentResult().data).toBe(previous)
    const completion = observer.refetch({ cancelRefetch: false })
    resolveNext(replacement)
    await completion
    expect(observer.getCurrentResult().data?.pages).toEqual([replacement])
    expect(observer.getCurrentResult().isPlaceholderData).toBe(false)
    unsubscribe()
    observer.destroy()

    const nextDeployment = new InfiniteQueryObserver(queryClient, {
      ...hookPoolsFixtureQueryOptions({ ...BASE, pageSize: 100 }),
      enabled: false,
    })
    expect(nextDeployment.getCurrentResult().data).toBeUndefined()
    expect(nextDeployment.getCurrentResult().isPlaceholderData).toBe(false)
    nextDeployment.destroy()
  })

  it('defaults to selected-period volume descending and paginates independently of the total', async () => {
    const options = hookPoolsFixtureQueryOptions({ ...MAINNET, pageSize: 5 })
    const all = await queryClient.fetchInfiniteQuery({ ...options, pages: 10 })
    expect(all.pages[0]?.pools.map((pool) => pool.id)).toEqual([1, 2, 9, 17, 10].map(mainnetId))
    expect(all.pages[0]?.total).toBe(24)
    expect(all.pages[0]?.nextCursor).toBe(mainnetId(10))
    expect(all.pages.map((page) => page.pools.length)).toEqual([5, 5, 5, 5, 4])
    expect(all.pages.map((page) => page.total)).toEqual([24, 24, 24, 24, 24])
    expect(all.pageParams[0]).toBe('')
    expect(all.pageParams[1]).toBe(mainnetId(10))
    expect(all.pages.at(-1)?.nextCursor).toBeNull()
    expect(new Set(all.pages.flatMap((page) => page.pools.map((pool) => pool.id))).size).toBe(24)
  })

  it('keeps the same-address contract on another chain separate and supports one or no pools', async () => {
    const base = await queryClient.fetchInfiniteQuery(hookPoolsFixtureQueryOptions({ ...BASE, pageSize: 100 }))
    expect(base.pages[0]?.total).toBe(12)
    expect(base.pages[0]?.pools).toHaveLength(12)
    expect(base.pages[0]?.pools[0]).toMatchObject(BASE)

    const one = await queryClient.fetchInfiniteQuery(
      hookPoolsFixtureQueryOptions({
        pageSize: 100,
        ...BASE,
        hookAddress: '0x4444444444444444444444444444444444444444',
      }),
    )
    expect(one.pages[0]?.total).toBe(1)
    expect(one.pages[0]?.pools).toHaveLength(1)
    expect(one.pages[0]?.nextCursor).toBeNull()

    const arbitrum = await queryClient.fetchInfiniteQuery(
      hookPoolsFixtureQueryOptions({ pageSize: 100, ...MAINNET, chainId: UniverseChainId.ArbitrumOne }),
    )
    expect(arbitrum.pages).toEqual([{ pools: [], total: 0, nextCursor: null }])
  })

  it.each([
    [PoolSortFields.TVL, false, TimePeriod.DAY, [1, 2, 9]],
    [PoolSortFields.TVL, true, TimePeriod.DAY, [6, 7, 14]],
    [PoolSortFields.Apr, false, TimePeriod.DAY, [4, 12, 20]],
    [PoolSortFields.RewardApr, true, TimePeriod.DAY, [6, 7, 14]],
    [PoolSortFields.Volume24h, true, TimePeriod.DAY, [6, 7, 14]],
    [PoolSortFields.Volume30D, false, TimePeriod.MONTH, [1, 2, 9]],
    [PoolSortFields.Volume24h, true, TimePeriod.MONTH, [6, 14, 22]],
    [PoolSortFields.VolOverTvl, false, TimePeriod.DAY, [1, 9, 17]],
    [PoolSortFields.VolOverTvl, true, TimePeriod.DAY, [5, 13, 21]],
    [PoolSortFields.VolOverTvl, false, TimePeriod.MONTH, [1, 2, 9]],
  ] as const)(
    'sorts %s ascending=%s in %s with unavailable values last',
    async (sortMethod, sortAscending, period, expected) => {
      const result = await queryClient.fetchInfiniteQuery({
        ...hookPoolsFixtureQueryOptions({ ...MAINNET, sortMethod, sortAscending, period, pageSize: 3 }),
        pages: 10,
      })
      const pools = result.pages.flatMap((page) => page.pools)
      expect(pools.slice(0, 3).map((pool) => pool.id)).toEqual(expected.map(mainnetId))
      expect(pools.at(-1)?.id).toBe(mainnetId(24))
      expect(HOOK_POOL_FIXTURES[0]?.pools.map((pool) => pool.id)).toEqual(
        Array.from({ length: 24 }, (_, index) => mainnetId(index + 1)),
      )
    },
  )

  it('isolates every committed context in the query key and starts each at the first page', async () => {
    const defaults = hookPoolsFixtureQueryOptions({ ...MAINNET, pageSize: 5 })
    await queryClient.fetchInfiniteQuery({ ...defaults, pages: 10 })
    for (const options of [
      hookPoolsFixtureQueryOptions({ pageSize: 100, ...MAINNET, chainId: UniverseChainId.ArbitrumOne }),
      hookPoolsFixtureQueryOptions({
        pageSize: 100,
        ...MAINNET,
        hookAddress: '0x5555555555555555555555555555555555555555',
      }),
      hookPoolsFixtureQueryOptions({ pageSize: 100, ...MAINNET, sortMethod: PoolSortFields.TVL }),
      hookPoolsFixtureQueryOptions({ pageSize: 100, ...MAINNET, sortAscending: true }),
      hookPoolsFixtureQueryOptions({ pageSize: 100, ...MAINNET, period: TimePeriod.MONTH }),
      hookPoolsFixtureQueryOptions({ ...MAINNET, pageSize: 2 }),
    ]) {
      expect(options.queryKey).not.toEqual(defaults.queryKey)
      expect(options.initialPageParam).toBe('')
      const result = await queryClient.fetchInfiniteQuery(options)
      expect(result.pageParams).toEqual([''])
      expect(result.pages).toHaveLength(1)
    }
    expect(
      hookPoolsFixtureQueryOptions({
        pageSize: 100,
        chainId: UniverseChainId.Optimism,
        hookAddress: '0xABCDEF123456789012345678901234567890ABCD',
      }).queryKey,
    ).toEqual(
      hookPoolsFixtureQueryOptions({
        pageSize: 100,
        chainId: UniverseChainId.Optimism,
        hookAddress: '0xabcdef123456789012345678901234567890abcd',
      }).queryKey,
    )
  })

  it('rejects an unknown deployment rather than inventing an empty result or zero total', async () => {
    await expect(
      queryClient.fetchInfiniteQuery(
        hookPoolsFixtureQueryOptions({ pageSize: 100, ...BASE, hookAddress: MAINNET.hookAddress }),
      ),
    ).rejects.toThrow('Unknown hook pools fixture deployment')
  })

  it('rejects a cursor from another deployment', async () => {
    await expect(
      queryClient.fetchInfiniteQuery({
        ...hookPoolsFixtureQueryOptions({ ...BASE, pageSize: 100 }),
        initialPageParam: mainnetId(5),
      }),
    ).rejects.toThrow('Unknown hook pools fixture cursor')
  })

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid page size %s', (pageSize) => {
    expect(() => hookPoolsFixtureQueryOptions({ ...MAINNET, pageSize })).toThrow(
      'Hook pools page size must be a positive integer',
    )
  })
})

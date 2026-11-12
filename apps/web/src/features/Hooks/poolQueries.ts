import { type InfiniteData, infiniteQueryOptions, keepPreviousData } from '@tanstack/react-query'
import type { UniverseChainId } from '@universe/chains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { InfiniteQueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { PoolSortFields } from '~/data/pools/poolStats'
import { TimePeriod } from '~/data/util'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import { HOOK_POOL_FIXTURES } from '~/features/Hooks/poolFixtures'
import type { PoolStat } from '~/types/explore'

interface HookPoolsFixturePage {
  pools: PoolStat[]
  total: number
  nextCursor: string | null
}

type HookPoolsFixtureQueryInput = {
  chainId: UniverseChainId
  hookAddress: string
  sortMethod?: PoolSortFields
  sortAscending?: boolean
  period?: TimePeriod.DAY | TimePeriod.MONTH
  pageSize: number
}

type HookPoolsFixtureQueryKey = readonly [
  ReactQueryCacheKey.Hooks,
  'fixture',
  'pools',
  {
    deploymentKey: string
    sortMethod: PoolSortFields
    sortAscending: boolean
    period: TimePeriod.DAY | TimePeriod.MONTH
    pageSize: number
  },
]

function getPoolSortValue({
  pool,
  sortMethod,
  period,
}: {
  pool: PoolStat
  sortMethod: PoolSortFields
  period: TimePeriod.DAY | TimePeriod.MONTH
}): number | undefined {
  switch (sortMethod) {
    case PoolSortFields.TVL:
      return pool.totalLiquidity?.value
    case PoolSortFields.Apr:
    case PoolSortFields.RewardApr:
      return pool.totalApr
    case PoolSortFields.Volume24h:
    case PoolSortFields.Volume30D:
      return period === TimePeriod.DAY ? pool.volume1Day?.value : pool.volume30Day?.value
    case PoolSortFields.VolOverTvl:
      return period === TimePeriod.DAY ? pool.volOverTvl : pool.volume30Day?.value
    default:
      return sortMethod satisfies never
  }
}

// TODO(CONS-3941): Remove preview pool queries when hook details use live deployment data.
export function hookPoolsFixtureQueryOptions({
  chainId,
  hookAddress,
  sortMethod = PoolSortFields.Volume24h,
  sortAscending = false,
  period = TimePeriod.DAY,
  pageSize,
}: HookPoolsFixtureQueryInput): InfiniteQueryOptionsResult<
  HookPoolsFixturePage,
  Error,
  InfiniteData<HookPoolsFixturePage>,
  HookPoolsFixtureQueryKey,
  string
> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('Hook pools page size must be a positive integer')
  }
  const deploymentKey = getHookDeploymentKey({ chainId, address: hookAddress })

  return infiniteQueryOptions({
    queryKey: [
      ReactQueryCacheKey.Hooks,
      'fixture',
      'pools',
      { deploymentKey, sortMethod, sortAscending, period, pageSize },
    ] as const,
    queryFn: ({ pageParam }): HookPoolsFixturePage => {
      const fixture = HOOK_POOL_FIXTURES.find(
        (candidate) =>
          getHookDeploymentKey({ chainId: candidate.chainId, address: candidate.hookAddress }) === deploymentKey,
      )
      if (!fixture) {
        throw new Error('Unknown hook pools fixture deployment')
      }
      const pools = [...fixture.pools].sort((left, right) => {
        const leftValue = getPoolSortValue({ pool: left, sortMethod, period })
        const rightValue = getPoolSortValue({ pool: right, sortMethod, period })
        if (leftValue === undefined && rightValue !== undefined) {
          return 1
        }
        if (rightValue === undefined && leftValue !== undefined) {
          return -1
        }
        if (leftValue !== undefined && rightValue !== undefined && leftValue !== rightValue) {
          return sortAscending ? leftValue - rightValue : rightValue - leftValue
        }
        return left.id.localeCompare(right.id)
      })
      const cursorIndex = pageParam ? pools.findIndex((pool) => pool.id === pageParam) : -1
      if (pageParam && cursorIndex === -1) {
        throw new Error('Unknown hook pools fixture cursor')
      }
      const start = cursorIndex + 1
      const pagePools = pools.slice(start, start + pageSize)
      return {
        pools: pagePools,
        total: fixture.total,
        nextCursor: start + pageSize < pools.length ? (pagePools.at(-1)?.id ?? null) : null,
      }
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
  })
}

import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { AddressStringFormat, normalizeAddress, type UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getHookRegistryKey } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import type { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { ALL_NETWORKS_LABEL } from 'uniswap/src/features/telemetry/types'
import { getHookDetailsURL } from 'uniswap/src/utils/linking'
import type { OrderDirection } from '~/data/util'
import { SHARED_NAVIGATION_SEARCH_PARAMS } from '~/features/Explore/poolArea/utils/poolAreaUrls'
import { getHookListStatus } from '~/features/Hooks/getHookListStatus'
import {
  type Hook,
  HookAccounting,
  HookIndexingStatus,
  type HookSortField,
  type HookVolumePeriod,
} from '~/features/Hooks/types'
import { getHookRowDeployment } from '~/pages/Explore/tables/Hooks/getHookRowDeployment'
import { getHookSortAnalyticsValue } from '~/pages/Explore/tables/Hooks/getHookSortAnalyticsValue'
import type { HookTableRow } from '~/pages/Explore/tables/Hooks/hooksTableTypes'

export function getHookTableRow({
  hook,
  chainId,
  position,
  registryMap,
  getTrustedProvenance,
  searchParams,
  search,
  period,
  sortField,
  sortDirection,
}: {
  hook: Hook
  chainId?: UniverseChainId
  position: number
  registryMap?: ReadonlyMap<string, HookEntry>
  getTrustedProvenance: ReturnType<typeof useUniswapHookProvenance>
  searchParams: URLSearchParams
  search?: string
  period: HookVolumePeriod
  sortField: HookSortField
  sortDirection: OrderDirection
}): HookTableRow | undefined {
  const deployment = getHookRowDeployment({ hook, chainId, search })
  if (!deployment) {
    return undefined
  }
  const address = normalizeAddress(deployment.address, AddressStringFormat.Lowercase)
  const registryEntry =
    !hook.isFixture && !deployment.isFixture
      ? registryMap?.get(getHookRegistryKey({ chainId: deployment.chainId, hookAddress: address }))
      : undefined
  const [pathname, destinationSearch] = getHookDetailsURL({
    hookAddress: address,
    chainId: deployment.chainId,
    referrer: HookDetailsReferrer.List,
  }).split('?')
  const destinationParams = new URLSearchParams(destinationSearch)
  for (const [key, value] of searchParams) {
    if (key !== 'chain' && SHARED_NAVIGATION_SEARCH_PARAMS.has(key)) {
      destinationParams.append(key, value)
    }
  }
  const customAccounting = hook.deployments.some((item) => item.accounting === HookAccounting.Custom)

  return {
    ...getHookListStatus({ deployments: hook.deployments, isFixture: hook.isFixture, getTrustedProvenance }),
    id: hook.id,
    name: hook.name?.trim() || registryEntry?.name.trim() || undefined,
    address,
    chainIds: hook.deployments.map((item) => item.chainId),
    href: `${pathname}?${destinationParams}`,
    customAccounting,
    partialIndexing: hook.deployments.some((item) => item.indexing === HookIndexingStatus.Partial),
    pools: hook.metrics.poolCount,
    volume: customAccounting ? null : hook.metrics.volumeUsd[period],
    tvl: hook.metrics.tvlUsd,
    testId: `${TestID.HookListRow}-${hook.id}`,
    analytics: {
      elementName: ElementName.HookListRow,
      properties: {
        hook_address: address,
        chain: chainId !== undefined ? getChainInfo(chainId).urlParam : ALL_NETWORKS_LABEL,
        chain_id: deployment.chainId,
        position,
        sort: getHookSortAnalyticsValue({ period, sortField, sortDirection }),
      },
    },
  }
}

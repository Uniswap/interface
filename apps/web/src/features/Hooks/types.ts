import type { UniverseChainId } from '@universe/chains'
import type { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import type { HookListOptions } from '~/features/Hooks/hookListOptions'

export enum HooksFixtureScenario {
  Default = 'default',
  Loading = 'loading',
  Error = 'error',
  Empty = 'empty',
  NotFound = 'not-found',
}

export enum HookSortField {
  Volume = 'volume',
  Tvl = 'tvl',
  Pools = 'pools',
}

export type HookVolumePeriod = '1d' | '7d' | '30d'

export enum HookSourceVerification {
  Verified = 'verified',
  Unverified = 'unverified',
  Unknown = 'unknown',
}

export enum HookRoutingStatus {
  Supported = 'supported',
  Unsupported = 'unsupported',
  Unknown = 'unknown',
}

export enum HookAccounting {
  Standard = 'standard',
  Custom = 'custom',
}

export enum HookIndexingStatus {
  Complete = 'complete',
  Partial = 'partial',
}

export interface HookMetrics {
  volumeUsd: Record<HookVolumePeriod, number | null>
  volumeAllTimeUsd: number | null
  tvlUsd: number | null
  feesAllTimeUsd: number | null
  poolCount: number | null
}

export interface HookActor {
  name: string
}

export interface HookDeployment {
  chainId: UniverseChainId
  address: string
  deployerAddress: string | null
  provenance: {
    builder: HookActor | null
    configurer: HookActor | null
  }
  fixtureProvenance: {
    kind: UniswapHookProvenance
    partnerName: string | null
  } | null
  sourceVerification: HookSourceVerification
  routingStatus: HookRoutingStatus
  accounting: HookAccounting
  indexing: HookIndexingStatus
  metrics: HookMetrics
  isFixture: boolean
}

export type HookDeploymentAddress = Pick<HookDeployment, 'chainId' | 'address' | 'deployerAddress'>

export interface Hook {
  id: string
  name: string | null
  hasMetadata: boolean | null
  description: string
  descriptionGeneratedByAi: boolean
  deployments: readonly [HookDeployment, ...HookDeployment[]]
  metrics: HookMetrics
  isFixture: boolean
}

export interface HookDetail extends Pick<
  Hook,
  'id' | 'name' | 'description' | 'descriptionGeneratedByAi' | 'isFixture'
> {
  deployment: HookDeployment
  deployments: readonly HookDeploymentAddress[]
}

export interface HookListSummary {
  totalHooks: number
  volumeAllTimeUsd: number | null
  tvlUsd: number | null
}

export interface HookListPage {
  hooks: readonly Hook[]
  nextCursor: string | null
  options: HookListOptions & { chainId: UniverseChainId | undefined }
}

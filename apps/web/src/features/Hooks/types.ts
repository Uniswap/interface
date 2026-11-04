import type { UniverseChainId } from '@universe/chains'

export enum HooksFixtureScenario {
  Default = 'default',
  Loading = 'loading',
  Error = 'error',
  Empty = 'empty',
  NotFound = 'not-found',
}

export enum HookSourceVerification {
  Verified = 'verified',
  Unverified = 'unverified',
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
  volumeUsd: Record<'1d' | '7d' | '30d', number | null>
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
  provenance: {
    builder: HookActor | null
    configurer: HookActor | null
  }
  sourceVerification: HookSourceVerification
  routingStatus: HookRoutingStatus
  accounting: HookAccounting
  indexing: HookIndexingStatus
  metrics: HookMetrics
  isFixture: boolean
}

export interface Hook {
  id: string
  name: string | null
  description: string
  deployments: readonly [HookDeployment, ...HookDeployment[]]
  metrics: HookMetrics
  isFixture: boolean
}

export interface HookListPage {
  hooks: readonly Hook[]
  totalCount: number
  nextPage: number | null
}

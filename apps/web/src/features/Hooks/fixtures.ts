import { UniverseChainId } from '@universe/chains'
import {
  type Hook,
  HookAccounting,
  HookIndexingStatus,
  type HookMetrics,
  HookRoutingStatus,
  HooksFixtureScenario,
  HookSourceVerification,
} from '~/features/Hooks/types'

export function parseHooksFixtureScenario(value: string | null): HooksFixtureScenario {
  return Object.values(HooksFixtureScenario).find((scenario) => scenario === value) ?? HooksFixtureScenario.Default
}

const ZERO_METRICS: HookMetrics = {
  volumeUsd: { '1d': 0, '7d': 0, '30d': 0 },
  tvlUsd: 0,
  feesAllTimeUsd: 0,
  poolCount: 0,
}

const UNAVAILABLE_METRICS: HookMetrics = {
  volumeUsd: { '1d': null, '7d': null, '30d': null },
  tvlUsd: null,
  feesAllTimeUsd: null,
  poolCount: null,
}

export const HOOK_FIXTURES: readonly Hook[] = [
  {
    id: 'hk_7b8a2e',
    name: 'Angstrom',
    description: 'Auction-based swaps with protection against arbitrage.',
    metrics: {
      volumeUsd: { '1d': 14_200_000, '7d': 92_100_000, '30d': 351_400_000 },
      tvlUsd: 38_500_000,
      feesAllTimeUsd: 2_840_000,
      poolCount: 36,
    },
    deployments: [
      {
        chainId: UniverseChainId.Mainnet,
        address: '0x1111111111111111111111111111111111111111',
        provenance: { builder: { name: 'Sorella Labs' }, configurer: null },
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Supported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 10_100_000, '7d': 65_800_000, '30d': 249_100_000 },
          tvlUsd: 28_000_000,
          feesAllTimeUsd: 2_020_000,
          poolCount: 24,
        },
        isFixture: true,
      },
      {
        chainId: UniverseChainId.Base,
        address: '0x2222222222222222222222222222222222222222',
        provenance: { builder: { name: 'Sorella Labs' }, configurer: null },
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Supported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 4_100_000, '7d': 26_300_000, '30d': 102_300_000 },
          tvlUsd: 10_500_000,
          feesAllTimeUsd: 820_000,
          poolCount: 12,
        },
        isFixture: true,
      },
    ],
    isFixture: true,
  },
  {
    id: 'hk_a93c10',
    name: 'Bunni',
    description: 'Custom liquidity accounting with partial analytics availability.',
    metrics: {
      volumeUsd: { '1d': 2_800_000, '7d': 18_400_000, '30d': null },
      tvlUsd: null,
      feesAllTimeUsd: null,
      poolCount: 18,
    },
    deployments: [
      {
        chainId: UniverseChainId.Mainnet,
        address: '0x3333333333333333333333333333333333333333',
        provenance: { builder: { name: 'Bunni' }, configurer: null },
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Unknown,
        accounting: HookAccounting.Custom,
        indexing: HookIndexingStatus.Partial,
        metrics: {
          volumeUsd: { '1d': 2_800_000, '7d': 18_400_000, '30d': null },
          tvlUsd: null,
          feesAllTimeUsd: null,
          poolCount: 18,
        },
        isFixture: true,
      },
    ],
    isFixture: true,
  },
  {
    id: 'hk_f03d72',
    name: null,
    description: 'A verified deployment without registry display metadata.',
    metrics: ZERO_METRICS,
    deployments: [
      {
        chainId: UniverseChainId.ArbitrumOne,
        address: '0x1111111111111111111111111111111111111111',
        provenance: { builder: null, configurer: null },
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Unknown,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: ZERO_METRICS,
        isFixture: true,
      },
    ],
    isFixture: true,
  },
  {
    id: 'hk_2d15bf',
    name: null,
    description: 'An unverified deployment whose analytics are not available yet.',
    metrics: UNAVAILABLE_METRICS,
    deployments: [
      {
        chainId: UniverseChainId.Base,
        address: '0x4444444444444444444444444444444444444444',
        provenance: { builder: null, configurer: null },
        sourceVerification: HookSourceVerification.Unverified,
        routingStatus: HookRoutingStatus.Unsupported,
        accounting: HookAccounting.Custom,
        indexing: HookIndexingStatus.Partial,
        metrics: UNAVAILABLE_METRICS,
        isFixture: true,
      },
    ],
    isFixture: true,
  },
  {
    id: 'hk_c51e09',
    name: 'Dynamic fee preview',
    description: 'A sample hook built by Uniswap Labs.',
    metrics: {
      volumeUsd: { '1d': 720_000, '7d': 4_900_000, '30d': 19_600_000 },
      tvlUsd: 3_600_000,
      feesAllTimeUsd: 144_000,
      poolCount: 9,
    },
    deployments: [
      {
        chainId: UniverseChainId.Mainnet,
        address: '0x5555555555555555555555555555555555555555',
        provenance: { builder: { name: 'Uniswap Labs' }, configurer: null },
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Supported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 720_000, '7d': 4_900_000, '30d': 19_600_000 },
          tvlUsd: 3_600_000,
          feesAllTimeUsd: 144_000,
          poolCount: 9,
        },
        isFixture: true,
      },
    ],
    isFixture: true,
  },
  {
    id: 'hk_86a4c3',
    name: 'Configured hook preview',
    description: 'A sample hook configured by Uniswap Labs and built independently.',
    metrics: {
      volumeUsd: { '1d': 0, '7d': 48_000, '30d': 152_000 },
      tvlUsd: 420_000,
      feesAllTimeUsd: 15_200,
      poolCount: 2,
    },
    deployments: [
      {
        chainId: UniverseChainId.Base,
        address: '0x6666666666666666666666666666666666666666',
        provenance: { builder: { name: 'Independent builder' }, configurer: { name: 'Uniswap Labs' } },
        sourceVerification: HookSourceVerification.Unverified,
        routingStatus: HookRoutingStatus.Unsupported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 0, '7d': 48_000, '30d': 152_000 },
          tvlUsd: 420_000,
          feesAllTimeUsd: 15_200,
          poolCount: 2,
        },
        isFixture: true,
      },
    ],
    isFixture: true,
  },
]

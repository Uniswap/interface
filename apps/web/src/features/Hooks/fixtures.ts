import { UniverseChainId } from '@universe/chains'
import { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import {
  type Hook,
  HookAccounting,
  HookIndexingStatus,
  type HookListSummary,
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
  volumeAllTimeUsd: 0,
  tvlUsd: 0,
  feesAllTimeUsd: 0,
  poolCount: 0,
}

const UNAVAILABLE_METRICS: HookMetrics = {
  volumeUsd: { '1d': null, '7d': null, '30d': null },
  volumeAllTimeUsd: null,
  tvlUsd: null,
  feesAllTimeUsd: null,
  poolCount: null,
}

const PARTIAL_METRICS: HookMetrics = {
  volumeUsd: { '1d': 1_800, '7d': 12_000, '30d': null },
  volumeAllTimeUsd: null,
  tvlUsd: 1_240_000,
  feesAllTimeUsd: null,
  poolCount: 4,
}

export const HOOK_FIXTURES: readonly Hook[] = [
  {
    id: 'hk_7b8a2e',
    name: 'Angstrom',
    hasMetadata: true,
    description: 'Auction-based swaps with protection against arbitrage.',
    descriptionGeneratedByAi: false,
    metrics: {
      volumeUsd: { '1d': 14_200_000, '7d': 92_100_000, '30d': 351_400_000 },
      volumeAllTimeUsd: 1_100_000_000,
      tvlUsd: 38_500_000,
      feesAllTimeUsd: 2_840_000,
      poolCount: 36,
    },
    deployments: [
      {
        chainId: UniverseChainId.Mainnet,
        address: '0x1111111111111111111111111111111111111111',
        deployerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        provenance: { builder: { name: 'Sorella Labs' }, configurer: null },
        fixtureProvenance: null,
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Supported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 10_100_000, '7d': 65_800_000, '30d': 249_100_000 },
          volumeAllTimeUsd: 800_000_000,
          tvlUsd: 28_000_000,
          feesAllTimeUsd: 2_020_000,
          poolCount: 24,
        },
        isFixture: true,
      },
      {
        chainId: UniverseChainId.Base,
        address: '0x2222222222222222222222222222222222222222',
        deployerAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        provenance: { builder: { name: 'Sorella Labs' }, configurer: null },
        fixtureProvenance: null,
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Supported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 4_100_000, '7d': 26_300_000, '30d': 102_300_000 },
          volumeAllTimeUsd: 300_000_000,
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
    hasMetadata: true,
    description: 'Custom liquidity accounting with partial analytics availability.',
    descriptionGeneratedByAi: false,
    metrics: {
      volumeUsd: { '1d': 2_800_000, '7d': 18_400_000, '30d': null },
      volumeAllTimeUsd: null,
      tvlUsd: null,
      feesAllTimeUsd: null,
      poolCount: 18,
    },
    deployments: [
      {
        chainId: UniverseChainId.Mainnet,
        address: '0x3333333333333333333333333333333333333333',
        deployerAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
        provenance: { builder: { name: 'Bunni' }, configurer: null },
        fixtureProvenance: null,
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Unknown,
        accounting: HookAccounting.Custom,
        indexing: HookIndexingStatus.Partial,
        metrics: {
          volumeUsd: { '1d': 2_800_000, '7d': 18_400_000, '30d': null },
          volumeAllTimeUsd: null,
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
    hasMetadata: false,
    description: '',
    descriptionGeneratedByAi: false,
    metrics: ZERO_METRICS,
    deployments: [
      {
        chainId: UniverseChainId.ArbitrumOne,
        address: '0x1111111111111111111111111111111111111111',
        deployerAddress: null,

        provenance: { builder: null, configurer: null },
        fixtureProvenance: null,
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
    hasMetadata: false,
    description: '',
    descriptionGeneratedByAi: false,
    metrics: UNAVAILABLE_METRICS,
    deployments: [
      {
        chainId: UniverseChainId.Base,
        address: '0x4444444444444444444444444444444444444444',
        deployerAddress: null,
        provenance: { builder: null, configurer: null },
        fixtureProvenance: null,
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
    name: 'StablePairHook',
    hasMetadata: true,
    description:
      'StablePair is a Uniswap v4 dynamic-fee hook built for assets that trade around a known reference price. Instead of charging a flat fee on every swap, it uses that reference to set fees dynamically, capturing more value for LPs while keeping execution tight and predictable around the reference.',
    descriptionGeneratedByAi: true,
    metrics: {
      volumeUsd: { '1d': 720_000, '7d': 4_900_000, '30d': 19_600_000 },
      volumeAllTimeUsd: 3_200_000_000,
      tvlUsd: 950_100_000,
      feesAllTimeUsd: 824_100,
      poolCount: 9,
    },
    deployments: [
      {
        chainId: UniverseChainId.Mainnet,
        address: '0x5555555555555555555555555555555555555555',
        deployerAddress: '0xdddddddddddddddddddddddddddddddddddddddd',
        provenance: { builder: { name: 'Uniswap Labs' }, configurer: { name: 'Ondo' } },
        fixtureProvenance: { kind: UniswapHookProvenance.Built, partnerName: 'Ondo' },
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Supported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 720_000, '7d': 4_900_000, '30d': 19_600_000 },
          volumeAllTimeUsd: 3_200_000_000,
          tvlUsd: 950_100_000,
          feesAllTimeUsd: 824_100,
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
    hasMetadata: true,
    description: 'A sample hook configured by Uniswap Labs and built independently.',
    descriptionGeneratedByAi: false,
    metrics: {
      volumeUsd: { '1d': 0, '7d': 48_000, '30d': 152_000 },
      volumeAllTimeUsd: 640_000,
      tvlUsd: 420_000,
      feesAllTimeUsd: 15_200,
      poolCount: 2,
    },
    deployments: [
      {
        chainId: UniverseChainId.Base,
        address: '0x6666666666666666666666666666666666666666',
        deployerAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        provenance: { builder: { name: 'Independent builder' }, configurer: { name: 'Uniswap Labs' } },
        fixtureProvenance: { kind: UniswapHookProvenance.Configured, partnerName: 'Independent builder' },
        sourceVerification: HookSourceVerification.Unverified,
        routingStatus: HookRoutingStatus.Unsupported,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Complete,
        metrics: {
          volumeUsd: { '1d': 0, '7d': 48_000, '30d': 152_000 },
          volumeAllTimeUsd: 640_000,
          tvlUsd: 420_000,
          feesAllTimeUsd: 15_200,
          poolCount: 2,
        },
        isFixture: true,
      },
    ],
    isFixture: true,
  },
  {
    id: 'hk_53d1ca',
    name: 'Reference-price liquidity management and dynamic fee configuration preview',
    hasMetadata: true,
    description:
      'This sample deployment demonstrates how an extended hook description wraps on narrow screens while preserving the identity, verification and routing information. Its standard-accounting metrics are only partially indexed, so unavailable totals remain distinct from zero and available observations are retained without estimating the missing history.',
    descriptionGeneratedByAi: false,
    metrics: PARTIAL_METRICS,
    deployments: [
      {
        chainId: UniverseChainId.Optimism,
        address: '0xabcdef123456789012345678901234567890abcd',
        deployerAddress: null,
        provenance: { builder: { name: 'Uniswap Labs' }, configurer: { name: 'Uniswap Labs' } },
        fixtureProvenance: { kind: UniswapHookProvenance.BuiltAndConfigured, partnerName: null },
        sourceVerification: HookSourceVerification.Verified,
        routingStatus: HookRoutingStatus.Unknown,
        accounting: HookAccounting.Standard,
        indexing: HookIndexingStatus.Partial,
        metrics: PARTIAL_METRICS,
        isFixture: true,
      },
    ],
    isFixture: true,
  },
]

export const EMPTY_HOOK_LIST_SUMMARY_FIXTURE: HookListSummary = {
  totalHooks: 0,
  volumeAllTimeUsd: 0,
  tvlUsd: 0,
}

export const HOOK_LIST_SUMMARY_FIXTURE: HookListSummary = {
  totalHooks: 7,
  volumeAllTimeUsd: 4_300_640_000,
  tvlUsd: 990_260_000,
}

import { UniverseChainId } from '@universe/chains'
import { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { getHookProvenance } from '~/features/Hooks/getHookProvenance'
import {
  type HookDetail,
  HookAccounting,
  HookIndexingStatus,
  HookRoutingStatus,
  HookSourceVerification,
} from '~/features/Hooks/types'

const ADDRESS = '0x000000000000000000000000000000000000ABcD'
const HOOK: HookDetail = {
  id: 'hook-detail-provenance-test',
  name: null,
  description: '',
  descriptionGeneratedByAi: false,
  isFixture: true,
  deployments: [{ chainId: UniverseChainId.Base, address: ADDRESS, deployerAddress: null }],
  deployment: {
    chainId: UniverseChainId.Base,
    address: ADDRESS,
    deployerAddress: null,
    provenance: { builder: { name: 'Real builder' }, configurer: { name: 'Real configurer' } },
    fixtureProvenance: { kind: UniswapHookProvenance.Built, partnerName: 'Fixture partner' },
    sourceVerification: HookSourceVerification.Verified,
    routingStatus: HookRoutingStatus.Supported,
    accounting: HookAccounting.Standard,
    indexing: HookIndexingStatus.Complete,
    metrics: {
      tvlUsd: null,
      volumeAllTimeUsd: null,
      volumeUsd: { '1d': null, '7d': null, '30d': null },
      feesAllTimeUsd: null,
      poolCount: null,
    },
    isFixture: true,
  },
}

describe('getHookProvenance', () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
  ] as const)(
    'uses trusted provenance unless both fixture markers are present (%s/%s)',
    (isFixture, deploymentIsFixture) => {
      const getTrustedProvenance = vi.fn(() => UniswapHookProvenance.Configured)
      const hook = { ...HOOK, isFixture, deployment: { ...HOOK.deployment, isFixture: deploymentIsFixture } }

      expect(
        getHookProvenance({ deployment: hook.deployment, isFixture: hook.isFixture, getTrustedProvenance }),
      ).toEqual({
        provenance: UniswapHookProvenance.Configured,
        builderName: 'Real builder',
        configurerName: 'Real configurer',
      })
      expect(getTrustedProvenance).toHaveBeenCalledExactlyOnceWith({ chainId: UniverseChainId.Base, address: ADDRESS })
    },
  )

  it.each([
    { kind: UniswapHookProvenance.Built, builderName: undefined, configurerName: 'Fixture partner' },
    { kind: UniswapHookProvenance.Configured, builderName: 'Fixture partner', configurerName: undefined },
    { kind: UniswapHookProvenance.BuiltAndConfigured, builderName: undefined, configurerName: undefined },
  ])('uses only authored fixture partners for $kind', ({ kind, builderName, configurerName }) => {
    const getTrustedProvenance = vi.fn(() => UniswapHookProvenance.Configured)
    const hook = {
      ...HOOK,
      deployment: { ...HOOK.deployment, fixtureProvenance: { kind, partnerName: 'Fixture partner' } },
    }

    expect(getHookProvenance({ deployment: hook.deployment, isFixture: hook.isFixture, getTrustedProvenance })).toEqual(
      {
        provenance: kind,
        builderName,
        configurerName,
      },
    )
    expect(getTrustedProvenance).not.toHaveBeenCalled()
  })

  it('does not fall back to trusted provenance when a marked fixture has none authored', () => {
    const getTrustedProvenance = vi.fn(() => UniswapHookProvenance.BuiltAndConfigured)
    const hook = { ...HOOK, deployment: { ...HOOK.deployment, fixtureProvenance: null } }

    expect(getHookProvenance({ deployment: hook.deployment, isFixture: hook.isFixture, getTrustedProvenance })).toEqual(
      {
        provenance: undefined,
        builderName: undefined,
        configurerName: undefined,
      },
    )
    expect(getTrustedProvenance).not.toHaveBeenCalled()
  })

  it.each([UniswapHookProvenance.Built, UniswapHookProvenance.Configured])(
    'does not substitute real metadata for a missing %s fixture partner',
    (kind) => {
      const getTrustedProvenance = vi.fn(() => undefined)
      const hook = { ...HOOK, deployment: { ...HOOK.deployment, fixtureProvenance: { kind, partnerName: null } } }

      expect(
        getHookProvenance({ deployment: hook.deployment, isFixture: hook.isFixture, getTrustedProvenance }),
      ).toEqual({
        provenance: kind,
        builderName: undefined,
        configurerName: undefined,
      })
    },
  )

  it('does not infer live provenance from actor names or fixture metadata', () => {
    const getTrustedProvenance = vi.fn(() => undefined)
    const hook = {
      ...HOOK,
      isFixture: false,
      deployment: {
        ...HOOK.deployment,
        isFixture: false,
        provenance: { builder: { name: 'Uniswap Labs' }, configurer: null },
      },
    }

    expect(getHookProvenance({ deployment: hook.deployment, isFixture: hook.isFixture, getTrustedProvenance })).toEqual(
      {
        provenance: undefined,
        builderName: 'Uniswap Labs',
        configurerName: undefined,
      },
    )
  })

  it('keeps missing live partners absent even when fixture metadata supplies one', () => {
    const getTrustedProvenance = vi.fn(() => UniswapHookProvenance.Built)
    const hook = {
      ...HOOK,
      isFixture: false,
      deployment: { ...HOOK.deployment, isFixture: false, provenance: { builder: null, configurer: null } },
    }

    expect(getHookProvenance({ deployment: hook.deployment, isFixture: hook.isFixture, getTrustedProvenance })).toEqual(
      {
        provenance: UniswapHookProvenance.Built,
        builderName: undefined,
        configurerName: undefined,
      },
    )
  })
})

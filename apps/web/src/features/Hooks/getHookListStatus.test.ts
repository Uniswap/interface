import { UniverseChainId } from '@universe/chains'
import { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { getHookListStatus } from '~/features/Hooks/getHookListStatus'
import {
  type HookDeployment,
  HookAccounting,
  HookIndexingStatus,
  HookRoutingStatus,
  HookSourceVerification,
} from '~/features/Hooks/types'

const DEPLOYMENT: HookDeployment = {
  chainId: UniverseChainId.Mainnet,
  address: '0x0000000000000000000000000000000000000001',
  deployerAddress: null,
  provenance: { builder: { name: 'Real builder' }, configurer: { name: 'Real configurer' } },
  fixtureProvenance: { kind: UniswapHookProvenance.Built, partnerName: 'Fixture partner' },
  sourceVerification: HookSourceVerification.Verified,
  routingStatus: HookRoutingStatus.Supported,
  accounting: HookAccounting.Standard,
  indexing: HookIndexingStatus.Complete,
  metrics: {
    volumeUsd: { '1d': null, '7d': null, '30d': null },
    volumeAllTimeUsd: null,
    tvlUsd: null,
    feesAllTimeUsd: null,
    poolCount: null,
  },
  isFixture: true,
}

describe('getHookListStatus', () => {
  it('qualifies verified source and shared provenance across scoped deployments', () => {
    const getTrustedProvenance = vi.fn(() => undefined)
    const next = { ...DEPLOYMENT, chainId: UniverseChainId.Base }

    expect(getHookListStatus({ deployments: [DEPLOYMENT, next], isFixture: true, getTrustedProvenance })).toEqual({
      sourceVerified: true,
      routingStatus: HookRoutingStatus.Supported,
      provenance: UniswapHookProvenance.Built,
      builderName: undefined,
      configurerName: 'Fixture partner',
    })
    expect(getTrustedProvenance).not.toHaveBeenCalled()
  })

  it.each([HookRoutingStatus.Unsupported, HookRoutingStatus.Unknown])(
    'qualifies routing when either deployment is supported alongside %s',
    (routingStatus) => {
      const other = { ...DEPLOYMENT, routingStatus }
      const getTrustedProvenance = vi.fn(() => undefined)
      for (const deployments of [
        [DEPLOYMENT, other],
        [other, DEPLOYMENT],
      ] as const) {
        const status = getHookListStatus({ deployments, isFixture: true, getTrustedProvenance })

        expect(status.sourceVerified).toBe(true)
        expect(status.routingStatus).toBe(HookRoutingStatus.Supported)
        expect(status.provenance).toBe(UniswapHookProvenance.Built)
      }
    },
  )

  it.each([
    [HookRoutingStatus.Unsupported, HookRoutingStatus.Unsupported],
    [HookRoutingStatus.Unsupported, HookRoutingStatus.Unknown],
    [HookRoutingStatus.Unknown, HookRoutingStatus.Unsupported],
    [HookRoutingStatus.Unknown, HookRoutingStatus.Unknown],
  ])('does not qualify routing without a supported deployment (%s, %s)', (first, second) => {
    const status = getHookListStatus({
      deployments: [
        { ...DEPLOYMENT, routingStatus: first },
        { ...DEPLOYMENT, routingStatus: second },
      ],
      isFixture: true,
      getTrustedProvenance: () => undefined,
    })

    expect(status.sourceVerified).toBe(true)
    expect(status.routingStatus).toBe(HookRoutingStatus.Unknown)
  })

  it.each([HookSourceVerification.Unverified, HookSourceVerification.Unknown])(
    'does not promote one verified deployment to a verified group alongside %s',
    (sourceVerification) => {
      const other = { ...DEPLOYMENT, sourceVerification }
      for (const deployments of [
        [DEPLOYMENT, other],
        [other, DEPLOYMENT],
      ] as const) {
        const status = getHookListStatus({
          deployments,
          isFixture: true,
          getTrustedProvenance: () => undefined,
        })

        expect(status.sourceVerified).toBe(false)
        expect(status.routingStatus).toBe(HookRoutingStatus.Supported)
      }
    },
  )

  it.each([
    null,
    { kind: UniswapHookProvenance.Configured, partnerName: 'Fixture partner' },
    { kind: UniswapHookProvenance.Built, partnerName: 'Different partner' },
    { kind: UniswapHookProvenance.Built, partnerName: null },
  ])('omits provenance rather than using one deployment’s explanation for a mixed group (%o)', (fixtureProvenance) => {
    const status = getHookListStatus({
      deployments: [DEPLOYMENT, { ...DEPLOYMENT, fixtureProvenance }],
      isFixture: true,
      getTrustedProvenance: () => undefined,
    })

    expect(status.provenance).toBeUndefined()
    expect(status.builderName).toBeUndefined()
    expect(status.configurerName).toBeUndefined()
  })

  it.each([UniswapHookProvenance.Built, UniswapHookProvenance.Configured])(
    'normalizes partner whitespace before comparing %s explanations',
    (kind) => {
      const status = getHookListStatus({
        deployments: [
          { ...DEPLOYMENT, fixtureProvenance: { kind, partnerName: '  Fixture partner  ' } },
          { ...DEPLOYMENT, fixtureProvenance: { kind, partnerName: 'Fixture partner' } },
        ],
        isFixture: true,
        getTrustedProvenance: () => undefined,
      })

      expect(status.provenance).toBe(kind)
      expect(kind === UniswapHookProvenance.Built ? status.configurerName : status.builderName).toBe('Fixture partner')
    },
  )

  it('uses trusted chain/address qualification for any deployment not marked as a fixture', () => {
    const live = { ...DEPLOYMENT, chainId: UniverseChainId.Base, isFixture: false }
    const getTrustedProvenance = vi.fn(() => UniswapHookProvenance.Built)
    const status = getHookListStatus({ deployments: [DEPLOYMENT, live], isFixture: true, getTrustedProvenance })

    expect(getTrustedProvenance).toHaveBeenCalledExactlyOnceWith({
      chainId: UniverseChainId.Base,
      address: live.address,
    })
    expect(status.provenance).toBeUndefined()
  })

  it('does not infer a live group’s provenance from fixture metadata or actor names', () => {
    const getTrustedProvenance = vi.fn(() => undefined)
    const status = getHookListStatus({ deployments: [DEPLOYMENT], isFixture: false, getTrustedProvenance })

    expect(status.provenance).toBeUndefined()
    expect(getTrustedProvenance).toHaveBeenCalledExactlyOnceWith({
      chainId: DEPLOYMENT.chainId,
      address: DEPLOYMENT.address,
    })
  })

  it('compares only the relevant partner when trusted live provenance agrees', () => {
    const getTrustedProvenance = vi.fn(() => UniswapHookProvenance.Built)
    const status = getHookListStatus({
      deployments: [
        { ...DEPLOYMENT, provenance: { builder: { name: 'Uniswap Labs' }, configurer: { name: ' Partner ' } } },
        { ...DEPLOYMENT, provenance: { builder: { name: 'Uniswap' }, configurer: { name: 'Partner' } } },
      ],
      isFixture: false,
      getTrustedProvenance,
    })

    expect(status.provenance).toBe(UniswapHookProvenance.Built)
    expect(status.configurerName).toBe('Partner')
    expect(getTrustedProvenance).toHaveBeenCalledTimes(2)
  })

  it('does not use irrelevant actor metadata to contradict trusted built-and-configured provenance', () => {
    const status = getHookListStatus({
      deployments: [DEPLOYMENT, { ...DEPLOYMENT, provenance: { builder: null, configurer: null } }],
      isFixture: false,
      getTrustedProvenance: () => UniswapHookProvenance.BuiltAndConfigured,
    })

    expect(status.provenance).toBe(UniswapHookProvenance.BuiltAndConfigured)
  })

  it('uses only the scoped deployment instead of an out-of-scope group status', () => {
    const status = getHookListStatus({
      deployments: [DEPLOYMENT],
      isFixture: true,
      getTrustedProvenance: () => undefined,
    })

    expect(status.sourceVerified).toBe(true)
    expect(status.routingStatus).toBe(HookRoutingStatus.Supported)
  })
})

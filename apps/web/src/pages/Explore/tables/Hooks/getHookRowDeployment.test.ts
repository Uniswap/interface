import { UniverseChainId } from '@universe/chains'
import {
  type Hook,
  HookAccounting,
  type HookDeployment,
  HookIndexingStatus,
  type HookMetrics,
  HookRoutingStatus,
  HookSourceVerification,
} from '~/features/Hooks/types'
import { getHookRowDeployment } from '~/pages/Explore/tables/Hooks/getHookRowDeployment'

const LOWER_ADDRESS = '0x000000000000000000000000000000000000abcd'
const HIGHER_ADDRESS = '0x000000000000000000000000000000000000efab'
const METRICS: HookMetrics = {
  tvlUsd: null,
  volumeUsd: { '1d': null, '7d': null, '30d': null },
  volumeAllTimeUsd: null,
  feesAllTimeUsd: null,
  poolCount: null,
}

function makeDeployment({
  chainId,
  tvlUsd,
  address = LOWER_ADDRESS,
}: {
  chainId: UniverseChainId
  tvlUsd: number | null
  address?: string
}): HookDeployment {
  return {
    chainId,
    address,
    deployerAddress: null,
    metrics: { ...METRICS, tvlUsd },
    provenance: { builder: null, configurer: null },
    fixtureProvenance: null,
    sourceVerification: HookSourceVerification.Unverified,
    routingStatus: HookRoutingStatus.Unknown,
    accounting: HookAccounting.Standard,
    indexing: HookIndexingStatus.Complete,
    isFixture: true,
  }
}

function makeHook(...deployments: [HookDeployment, ...HookDeployment[]]): Hook {
  return {
    id: 'Opaque-MixedCase-Group-ID',
    name: null,
    hasMetadata: false,
    description: '',
    descriptionGeneratedByAi: false,
    metrics: METRICS,
    deployments,
    isFixture: true,
  }
}

describe('getHookRowDeployment', () => {
  const mainnet = makeDeployment({ chainId: UniverseChainId.Mainnet, tvlUsd: 10 })
  const base = makeDeployment({ chainId: UniverseChainId.Base, tvlUsd: 20 })

  it('chooses the highest deployment TVL for all networks, independently of group metrics', () => {
    const hook = makeHook(mainnet, base)

    expect(getHookRowDeployment({ hook })).toBe(base)
    expect(getHookRowDeployment({ hook: makeHook(base, mainnet) })).toBe(base)
    expect(hook.metrics.tvlUsd).toBeNull()
  })

  it('uses only the selected network even when its deployment has less TVL', () => {
    expect(getHookRowDeployment({ hook: makeHook(base, mainnet), chainId: UniverseChainId.Mainnet })).toBe(mainnet)
  })

  it('prefers a full-address match over higher TVL without rewriting the group', () => {
    const match = makeDeployment({ chainId: UniverseChainId.Base, tvlUsd: 5, address: HIGHER_ADDRESS })
    const hook = makeHook(mainnet, match)
    Object.freeze(hook.deployments)

    expect(getHookRowDeployment({ hook, search: `  ${HIGHER_ADDRESS.toUpperCase()}  ` })).toBe(match)
    expect(hook.deployments).toEqual([mainnet, match])
    expect(hook.metrics).toBe(METRICS)
    expect(hook.id).toBe('Opaque-MixedCase-Group-ID')
  })

  it('uses highest TVL and normalized identity only among exact-address matches', () => {
    const nonmatching = makeDeployment({ chainId: UniverseChainId.Mainnet, tvlUsd: 100, address: HIGHER_ADDRESS })
    const baseMatch = makeDeployment({ chainId: UniverseChainId.Base, tvlUsd: 20 })
    const mainnetMatch = makeDeployment({ chainId: UniverseChainId.Mainnet, tvlUsd: 20 })

    expect(getHookRowDeployment({ hook: makeHook(nonmatching, baseMatch, mainnetMatch), search: LOWER_ADDRESS })).toBe(
      mainnetMatch,
    )
    expect(getHookRowDeployment({ hook: makeHook(mainnetMatch, nonmatching, baseMatch), search: LOWER_ADDRESS })).toBe(
      mainnetMatch,
    )
    expect(getHookRowDeployment({ hook: makeHook(mainnet, baseMatch), search: LOWER_ADDRESS })).toBe(baseMatch)
  })

  it('keeps selected-network priority and never substitutes a matching deployment from another network', () => {
    const match = makeDeployment({ chainId: UniverseChainId.Base, tvlUsd: 20, address: HIGHER_ADDRESS })
    const hook = makeHook(mainnet, match)

    expect(getHookRowDeployment({ hook, chainId: UniverseChainId.Mainnet, search: HIGHER_ADDRESS })).toBe(mainnet)
    expect(getHookRowDeployment({ hook, chainId: UniverseChainId.ArbitrumOne, search: HIGHER_ADDRESS })).toBeUndefined()
  })

  it('does not navigate to an unrelated deployment for an unmatched full address', () => {
    expect(getHookRowDeployment({ hook: makeHook(mainnet, base), search: HIGHER_ADDRESS })).toBeUndefined()
    expect(getHookRowDeployment({ hook: makeHook(mainnet, base), search: 'name search' })).toBe(base)
    expect(getHookRowDeployment({ hook: makeHook(mainnet, base), search: LOWER_ADDRESS.slice(0, -1) })).toBe(base)
  })

  it('does not substitute another network when the selected deployment is absent', () => {
    expect(
      getHookRowDeployment({ hook: makeHook(mainnet, base), chainId: UniverseChainId.ArbitrumOne }),
    ).toBeUndefined()
  })

  it('retains an available selected deployment even when its TVL is unavailable', () => {
    const unavailable = makeDeployment({ chainId: UniverseChainId.Mainnet, tvlUsd: null })

    expect(getHookRowDeployment({ hook: makeHook(unavailable, base), chainId: UniverseChainId.Mainnet })).toBe(
      unavailable,
    )
  })

  it('ranks a known zero above an unavailable TVL', () => {
    const unavailable = makeDeployment({ chainId: UniverseChainId.Mainnet, tvlUsd: null })
    const zero = makeDeployment({ chainId: UniverseChainId.Base, tvlUsd: 0 })

    expect(getHookRowDeployment({ hook: makeHook(unavailable, zero) })).toBe(zero)
    expect(getHookRowDeployment({ hook: makeHook(zero, unavailable) })).toBe(zero)
  })

  it.each([null, 0, 20])('breaks equal TVL (%s) ties by normalized chain/address identity', (tvlUsd) => {
    const mainnetTie = makeDeployment({ chainId: UniverseChainId.Mainnet, tvlUsd })
    const baseTie = makeDeployment({ chainId: UniverseChainId.Base, tvlUsd })

    expect(getHookRowDeployment({ hook: makeHook(baseTie, mainnetTie) })).toBe(mainnetTie)
    expect(getHookRowDeployment({ hook: makeHook(mainnetTie, baseTie) })).toBe(mainnetTie)
  })

  it('normalizes address case for tie-breaking without rewriting the selected deployment or opaque group ID', () => {
    const lower = makeDeployment({ chainId: UniverseChainId.Base, tvlUsd: 20, address: LOWER_ADDRESS })
    const higher = makeDeployment({
      chainId: UniverseChainId.Base,
      tvlUsd: 20,
      address: HIGHER_ADDRESS.toUpperCase(),
    })
    const hook = makeHook(higher, lower)

    expect(getHookRowDeployment({ hook })).toBe(lower)
    expect(getHookRowDeployment({ hook: makeHook(lower, higher) })).toBe(lower)
    expect(higher.address).toBe(HIGHER_ADDRESS.toUpperCase())
    expect(hook.id).toBe('Opaque-MixedCase-Group-ID')
  })

  it('returns a sole deployment and leaves the input order unchanged', () => {
    const hook = makeHook(base, mainnet)
    Object.freeze(hook.deployments)

    expect(getHookRowDeployment({ hook: makeHook(mainnet) })).toBe(mainnet)
    expect(getHookRowDeployment({ hook })).toBe(base)
    expect(hook.deployments).toEqual([base, mainnet])
  })
})

import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useToucanAuctionSupportedChains,
  useToucanTokenCreationSupportedChains,
} from '~/features/Toucan/supportedChains'
import {
  filterAllowedNetworksByTestnetMode,
  pinNewLaunchChains,
  useCreateAuctionAllowedNetworks,
  useCreateNewTokenAllowedNetworks,
} from '~/pages/Liquidity/CreateAuction/hooks/useAllowedNetworks'

/** The launcher chain lists as the surfaces see them: SDK-derived, with the rollout gates applied. */
function renderSupportedChains(): { auction: UniverseChainId[]; creation: UniverseChainId[] } {
  return {
    auction: renderHook(() => useToucanAuctionSupportedChains()).result.current,
    creation: renderHook(() => useToucanTokenCreationSupportedChains()).result.current,
  }
}

const testnetMode = { enabled: false }
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ isTestnetModeEnabled: testnetMode.enabled }),
}))

beforeEach(() => {
  testnetMode.enabled = false
})

describe('filterAllowedNetworksByTestnetMode', () => {
  const MIXED_NETWORKS = [
    UniverseChainId.Mainnet,
    UniverseChainId.Unichain,
    UniverseChainId.Base,
    UniverseChainId.Sepolia,
  ]

  it('keeps only mainnet chains when testnet mode is disabled', () => {
    expect(
      filterAllowedNetworksByTestnetMode({ allowedNetworkIds: MIXED_NETWORKS, isTestnetModeEnabled: false }),
    ).toEqual([UniverseChainId.Mainnet, UniverseChainId.Unichain, UniverseChainId.Base])
  })

  it('keeps only testnet chains when testnet mode is enabled', () => {
    expect(
      filterAllowedNetworksByTestnetMode({ allowedNetworkIds: MIXED_NETWORKS, isTestnetModeEnabled: true }),
    ).toEqual([UniverseChainId.Sepolia])
  })

  it('keeps every supported testnet chain when testnet mode is enabled', () => {
    expect(
      filterAllowedNetworksByTestnetMode({
        allowedNetworkIds: [UniverseChainId.Sepolia, UniverseChainId.UnichainSepolia, UniverseChainId.Base],
        isTestnetModeEnabled: true,
      }),
    ).toEqual([UniverseChainId.Sepolia, UniverseChainId.UnichainSepolia])
  })

  it('drops ids that are not valid UniverseChainIds', () => {
    expect(
      filterAllowedNetworksByTestnetMode({
        allowedNetworkIds: [UniverseChainId.Mainnet, 999999 as UniverseChainId, UniverseChainId.Sepolia],
        isTestnetModeEnabled: false,
      }),
    ).toEqual([UniverseChainId.Mainnet])
  })

  it('preserves the order of the allowed list', () => {
    expect(
      filterAllowedNetworksByTestnetMode({
        allowedNetworkIds: [UniverseChainId.Base, UniverseChainId.Mainnet, UniverseChainId.Unichain],
        isTestnetModeEnabled: false,
      }),
    ).toEqual([UniverseChainId.Base, UniverseChainId.Mainnet, UniverseChainId.Unichain])
  })

  it('returns an empty list when no allowed chains match the current mode', () => {
    expect(
      filterAllowedNetworksByTestnetMode({
        allowedNetworkIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
        isTestnetModeEnabled: true,
      }),
    ).toEqual([])
  })
})

describe('SDK-derived chain lists', () => {
  it('supported chains come from the SDK intersected with app-registered chains', () => {
    // base-sepolia is in the SDK but not an app-registered chain, so the intersection keeps it
    // invisible. New chains appear via an SDK bump, not a code change here. XLayer remains
    // launched but hidden on web prod (HIDDEN_LAUNCH_CHAINS in supportedChains.ts).
    expect(new Set(renderSupportedChains().auction)).toEqual(
      new Set([
        UniverseChainId.Mainnet,
        UniverseChainId.Unichain,
        UniverseChainId.Base,
        UniverseChainId.ArbitrumOne,
        UniverseChainId.Avalanche,
        UniverseChainId.Robinhood,
        UniverseChainId.Ink,
        UniverseChainId.Sepolia,
      ]),
    )
  })

  it('hides launched-but-hidden chains from every derived list', () => {
    const { auction, creation } = renderSupportedChains()
    for (const hidden of [UniverseChainId.XLayer]) {
      expect(auction).not.toContain(hidden)
      expect(creation).not.toContain(hidden)
    }
  })

  it('hides Arc while its rollout flag is off', () => {
    // Vacuously true until the SDK bump lands Arc in the launcher registry; the gate itself is
    // exercised against a registry that carries Arc in supportedChains.test.ts.
    const { auction, creation } = renderSupportedChains()
    expect(auction).not.toContain(UniverseChainId.Arc)
    expect(creation).not.toContain(UniverseChainId.Arc)
  })

  it('token-creation chains are the supported chains whose stack has a token factory', () => {
    const { auction, creation } = renderSupportedChains()
    expect(creation.every((id) => auction.includes(id))).toBe(true)
  })

  it('pins Mainnet first — the network pickers default to the head of the list', () => {
    const { auction, creation } = renderSupportedChains()
    expect(auction[0]).toBe(UniverseChainId.Mainnet)
    expect(creation[0]).toBe(UniverseChainId.Mainnet)
  })
})

describe('pinNewLaunchChains', () => {
  it('pins Robinhood directly under Mainnet, preserving the relative order of the rest', () => {
    expect(
      pinNewLaunchChains([
        UniverseChainId.Mainnet,
        UniverseChainId.Unichain,
        UniverseChainId.Base,
        UniverseChainId.Robinhood,
        UniverseChainId.Avalanche,
      ]),
    ).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Robinhood,
      UniverseChainId.Unichain,
      UniverseChainId.Base,
      UniverseChainId.Avalanche,
    ])
  })

  it('is a no-op when no featured chain is present (e.g. testnet mode)', () => {
    expect(pinNewLaunchChains([UniverseChainId.Sepolia])).toEqual([UniverseChainId.Sepolia])
    expect(pinNewLaunchChains([])).toEqual([])
  })

  it('keeps Mainnet first even when a featured chain precedes it in the input', () => {
    expect(pinNewLaunchChains([UniverseChainId.Robinhood, UniverseChainId.Mainnet, UniverseChainId.Base])).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.Robinhood,
      UniverseChainId.Base,
    ])
  })
})

describe('useCreateNewTokenAllowedNetworks', () => {
  it('excludes testnet chains when testnet mode is disabled', () => {
    const { result } = renderHook(() => useCreateNewTokenAllowedNetworks())
    expect(new Set(result.current)).toEqual(
      new Set(renderSupportedChains().creation.filter((id) => id !== UniverseChainId.Sepolia)),
    )
  })

  it('pins Mainnet first and Robinhood second', () => {
    const { result } = renderHook(() => useCreateNewTokenAllowedNetworks())
    expect(result.current[0]).toBe(UniverseChainId.Mainnet)
    expect(result.current[1]).toBe(UniverseChainId.Robinhood)
  })

  it('shows only testnet chains when testnet mode is enabled', () => {
    testnetMode.enabled = true
    const { result } = renderHook(() => useCreateNewTokenAllowedNetworks())
    expect(result.current).toEqual([UniverseChainId.Sepolia])
  })
})

describe('useCreateAuctionAllowedNetworks', () => {
  it('excludes testnet chains when testnet mode is disabled', () => {
    const { result } = renderHook(() => useCreateAuctionAllowedNetworks())
    expect(new Set(result.current)).toEqual(
      new Set(renderSupportedChains().auction.filter((id) => id !== UniverseChainId.Sepolia)),
    )
  })

  it('pins Mainnet first and Robinhood second', () => {
    const { result } = renderHook(() => useCreateAuctionAllowedNetworks())
    expect(result.current[0]).toBe(UniverseChainId.Mainnet)
    expect(result.current[1]).toBe(UniverseChainId.Robinhood)
  })

  it('shows only testnet chains when testnet mode is enabled', () => {
    testnetMode.enabled = true
    const { result } = renderHook(() => useCreateAuctionAllowedNetworks())
    expect(result.current).toEqual([UniverseChainId.Sepolia])
  })
})

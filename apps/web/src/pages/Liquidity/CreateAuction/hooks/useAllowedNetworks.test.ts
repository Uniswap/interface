import { renderHook } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOUCAN_AUCTION_SUPPORTED_CHAINS,
  TOUCAN_TOKEN_CREATION_SUPPORTED_CHAINS,
} from '~/features/Toucan/supportedChains'
import {
  filterAllowedNetworksByTestnetMode,
  pinNewLaunchChains,
  useCreateAuctionAllowedNetworks,
  useCreateNewTokenAllowedNetworks,
} from '~/pages/Liquidity/CreateAuction/hooks/useAllowedNetworks'

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
    // SDK 0.2.1 added avalanche, xlayer, and robinhood; base-sepolia is in the SDK but not an
    // app-registered chain, so the intersection keeps it invisible. New chains appear via an
    // SDK bump, not a code change here. Avalanche and XLayer are launched but hidden on web
    // prod for this release (HIDDEN_LAUNCH_CHAINS in supportedChains.ts).
    expect(new Set(TOUCAN_AUCTION_SUPPORTED_CHAINS)).toEqual(
      new Set([
        UniverseChainId.Mainnet,
        UniverseChainId.Unichain,
        UniverseChainId.Base,
        UniverseChainId.ArbitrumOne,
        UniverseChainId.Robinhood,
        UniverseChainId.Sepolia,
      ]),
    )
  })

  it('hides launched-but-hidden chains from every derived list', () => {
    for (const hidden of [UniverseChainId.Avalanche, UniverseChainId.XLayer]) {
      expect(TOUCAN_AUCTION_SUPPORTED_CHAINS).not.toContain(hidden)
      expect(TOUCAN_TOKEN_CREATION_SUPPORTED_CHAINS).not.toContain(hidden)
    }
  })

  it('token-creation chains are the supported chains whose stack has a token factory', () => {
    expect(TOUCAN_TOKEN_CREATION_SUPPORTED_CHAINS.every((id) => TOUCAN_AUCTION_SUPPORTED_CHAINS.includes(id))).toBe(
      true,
    )
  })

  it('pins Mainnet first — the network pickers default to the head of the list', () => {
    expect(TOUCAN_AUCTION_SUPPORTED_CHAINS[0]).toBe(UniverseChainId.Mainnet)
    expect(TOUCAN_TOKEN_CREATION_SUPPORTED_CHAINS[0]).toBe(UniverseChainId.Mainnet)
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
      new Set(TOUCAN_TOKEN_CREATION_SUPPORTED_CHAINS.filter((id) => id !== UniverseChainId.Sepolia)),
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
      new Set(TOUCAN_AUCTION_SUPPORTED_CHAINS.filter((id) => id !== UniverseChainId.Sepolia)),
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

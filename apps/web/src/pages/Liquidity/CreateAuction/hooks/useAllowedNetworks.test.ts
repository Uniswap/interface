import { renderHook } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  filterAllowedNetworksByTestnetMode,
  useCreateAuctionAllowedNetworks,
  useCreateNewTokenAllowedNetworks,
} from '~/pages/Liquidity/CreateAuction/hooks/useAllowedNetworks'

// Lets a test override the dynamic-config list; otherwise the hook's own default flows through,
// so each hook is exercised against its real default.
const override: { value?: UniverseChainId[] } = {}
vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useDynamicConfigValue: ({ defaultValue }: { defaultValue: UniverseChainId[] }) => override.value ?? defaultValue,
  }
})

const testnetMode = { enabled: false }
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({ isTestnetModeEnabled: testnetMode.enabled }),
}))

beforeEach(() => {
  testnetMode.enabled = false
  override.value = undefined
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

describe('useCreateNewTokenAllowedNetworks', () => {
  it('excludes testnet chains when testnet mode is disabled', () => {
    const { result } = renderHook(() => useCreateNewTokenAllowedNetworks())
    expect(result.current).toEqual([
      UniverseChainId.Unichain,
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
      UniverseChainId.ArbitrumOne,
    ])
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
    expect(result.current).toEqual([
      UniverseChainId.Unichain,
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
      UniverseChainId.ArbitrumOne,
    ])
  })

  it('shows only testnet chains when testnet mode is enabled', () => {
    testnetMode.enabled = true
    const { result } = renderHook(() => useCreateAuctionAllowedNetworks())
    expect(result.current).toEqual([UniverseChainId.Sepolia])
  })
})

import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { createGetSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createGetV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import {
  createGetProtocolsForChain,
  createGetUniswapXPriorityOrderFlag,
  createProtocolFilter,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  useFeatureFlag: jest.fn(),
  getFeatureFlag: jest.fn(),
}))

jest.mock('uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled', () => ({
  useV4SwapEnabled: jest.fn(),
  createGetV4SwapEnabled: jest.fn(),
}))

jest.mock('uniswap/src/contexts/UniswapContext', () => ({
  useUniswapContextSelector: jest.fn(),
}))

jest.mock('uniswap/src/features/chains/hooks/useSupportedChainId', () => ({
  createGetSupportedChainId: jest.fn(),
}))

jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: jest.fn(),
}))

const mockGetFeatureFlag = getFeatureFlag as jest.Mock
const mockCreateGetV4SwapEnabled = createGetV4SwapEnabled as jest.Mock
const mockCreateGetSupportedChainId = createGetSupportedChainId as jest.Mock

describe('protocols', () => {
  const allProtocols: FrontendSupportedProtocol[] = [
    TradingApi.ProtocolItems.UNISWAPX_V2,
    TradingApi.ProtocolItems.V4,
    TradingApi.ProtocolItems.V3,
    TradingApi.ProtocolItems.V2,
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createProtocolFilter', () => {
    it('returns all protocols when everything is enabled', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => true,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => false,
      })

      const result = protocolFilter(allProtocols, UniverseChainId.Mainnet)
      expect(result).toEqual(allProtocols)
    })

    it('filters out UniswapX when uniswapXEnabled is false', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => false,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => false,
      })

      const result = protocolFilter(allProtocols, UniverseChainId.Mainnet)
      expect(result).toEqual([TradingApi.ProtocolItems.V4, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V2])
    })

    it('filters out UniswapX when chain is not in LAUNCHED_UNISWAPX_CHAINS and no special conditions', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => true,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => false,
      })

      // Polygon is not in LAUNCHED_UNISWAPX_CHAINS
      const result = protocolFilter(allProtocols, UniverseChainId.Polygon)
      expect(result).toEqual([TradingApi.ProtocolItems.V4, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V2])
    })

    it('keeps UniswapX when priority orders are allowed', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => true,
        getPriorityOrderFlag: () => true,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => false,
      })

      // Even though Base is not in LAUNCHED_UNISWAPX_CHAINS, priority orders allow it
      const result = protocolFilter(allProtocols, UniverseChainId.Base)
      expect(result).toEqual(allProtocols)
    })

    it('keeps UniswapX and replaces V2 with V3 on Arbitrum when Dutch V3 is enabled', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => true,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => true,
      })

      const result = protocolFilter(allProtocols, UniverseChainId.ArbitrumOne)
      expect(result).toEqual([
        TradingApi.ProtocolItems.UNISWAPX_V3, // V2 replaced with V3
        TradingApi.ProtocolItems.V4,
        TradingApi.ProtocolItems.V3,
        TradingApi.ProtocolItems.V2,
      ])
    })

    it('filters out V4 when not supported', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => true,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => false,
        getArbitrumDutchV3Enabled: () => false,
      })

      const result = protocolFilter(allProtocols, UniverseChainId.Mainnet)
      expect(result).toEqual([
        TradingApi.ProtocolItems.UNISWAPX_V2,
        TradingApi.ProtocolItems.V3,
        TradingApi.ProtocolItems.V2,
      ])
    })

    it('handles empty protocol list', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => true,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => false,
      })

      const result = protocolFilter([], UniverseChainId.Mainnet)
      expect(result).toEqual([])
    })

    it('handles undefined chainId', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => true,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => false,
      })

      const result = protocolFilter(allProtocols, undefined)
      // When chainId is undefined, uniswapXAllowedForChain is false
      expect(result).toEqual([TradingApi.ProtocolItems.V4, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V2])
    })

    it('verifies duplicate filtering logic does not cause issues', () => {
      const protocolFilter = createProtocolFilter({
        getUniswapXEnabled: () => false,
        getPriorityOrderFlag: () => false,
        getV4Enabled: () => true,
        getArbitrumDutchV3Enabled: () => false,
      })

      // Start with duplicate UNISWAPX_V2 entries
      const protocolsWithDuplicates: FrontendSupportedProtocol[] = [
        TradingApi.ProtocolItems.UNISWAPX_V2,
        TradingApi.ProtocolItems.UNISWAPX_V2,
        TradingApi.ProtocolItems.V4,
        TradingApi.ProtocolItems.V3,
      ]

      const result = protocolFilter(protocolsWithDuplicates, UniverseChainId.Mainnet)
      // Both duplicates should be filtered out
      expect(result).toEqual([TradingApi.ProtocolItems.V4, TradingApi.ProtocolItems.V3])
    })
  })

  describe('createGetUniswapXPriorityOrderFlag', () => {
    it('returns true for Base with UniswapXPriorityOrdersBase flag enabled', () => {
      const getUniswapXPriorityOrderFlag = createGetUniswapXPriorityOrderFlag({
        getFeatureFlag: (flag) => flag === FeatureFlags.UniswapXPriorityOrdersBase,
      })

      expect(getUniswapXPriorityOrderFlag(UniverseChainId.Base)).toBe(true)
    })

    it('returns true for Optimism with UniswapXPriorityOrdersOptimism flag enabled', () => {
      const getUniswapXPriorityOrderFlag = createGetUniswapXPriorityOrderFlag({
        getFeatureFlag: (flag) => flag === FeatureFlags.UniswapXPriorityOrdersOptimism,
      })

      expect(getUniswapXPriorityOrderFlag(UniverseChainId.Optimism)).toBe(true)
    })

    it('returns true for Unichain with UniswapXPriorityOrdersUnichain flag enabled', () => {
      const getUniswapXPriorityOrderFlag = createGetUniswapXPriorityOrderFlag({
        getFeatureFlag: (flag) => flag === FeatureFlags.UniswapXPriorityOrdersUnichain,
      })

      expect(getUniswapXPriorityOrderFlag(UniverseChainId.Unichain)).toBe(true)
    })

    it('returns false when chainId is undefined', () => {
      const getUniswapXPriorityOrderFlag = createGetUniswapXPriorityOrderFlag({
        getFeatureFlag: () => true,
      })

      expect(getUniswapXPriorityOrderFlag(undefined)).toBe(false)
    })

    it('returns false for chains not in the priority orders map', () => {
      const getUniswapXPriorityOrderFlag = createGetUniswapXPriorityOrderFlag({
        getFeatureFlag: () => true,
      })

      expect(getUniswapXPriorityOrderFlag(UniverseChainId.Mainnet)).toBe(false)
      expect(getUniswapXPriorityOrderFlag(UniverseChainId.Polygon)).toBe(false)
    })

    it('returns false when chainId is undefined without checking flags', () => {
      const mGetFeatureFlag = jest.fn(() => true)
      const getUniswapXPriorityOrderFlag = createGetUniswapXPriorityOrderFlag({
        getFeatureFlag: mGetFeatureFlag,
      })

      expect(getUniswapXPriorityOrderFlag(undefined)).toBe(false)
      // Should not check any flags when chainId is undefined
      expect(mGetFeatureFlag).not.toHaveBeenCalled()
    })
  })

  describe('createGetProtocolsForChain', () => {
    beforeEach(() => {
      // Default mock implementations
      mockGetFeatureFlag.mockReturnValue(false)
      mockCreateGetV4SwapEnabled.mockReturnValue(() => true)
      mockCreateGetSupportedChainId.mockReturnValue({
        getSupportedChainId: (chainId?: number) => chainId as UniverseChainId | undefined,
      })
    })

    it('creates a working filter function', () => {
      const getProtocolsFilter = createGetProtocolsForChain({
        getEnabledChains: () => [UniverseChainId.Mainnet, UniverseChainId.Polygon],
      })

      expect(typeof getProtocolsFilter).toBe('function')

      const result = getProtocolsFilter(allProtocols, UniverseChainId.Mainnet)
      expect(Array.isArray(result)).toBe(true)
    })

    it('correctly combines feature flags', () => {
      mockGetFeatureFlag.mockImplementation((flag: FeatureFlags) => {
        if (flag === FeatureFlags.UniswapX) {
          return true
        }
        if (flag === FeatureFlags.ArbitrumDutchV3) {
          return true
        }
        return false
      })

      const getProtocolsFilter = createGetProtocolsForChain({
        getEnabledChains: () => [UniverseChainId.ArbitrumOne],
      })

      const result = getProtocolsFilter(allProtocols, UniverseChainId.ArbitrumOne)
      // Should have UNISWAPX_V3 instead of V2 due to ArbitrumDutchV3 flag
      expect(result).toContain(TradingApi.ProtocolItems.UNISWAPX_V3)
      expect(result).not.toContain(TradingApi.ProtocolItems.UNISWAPX_V2)
    })

    it('handles missing getIsUniswapXSupported (uses feature flag only)', () => {
      mockGetFeatureFlag.mockImplementation((flag: FeatureFlags) => {
        return flag === FeatureFlags.UniswapX
      })

      const getProtocolsFilter = createGetProtocolsForChain({
        getEnabledChains: () => [UniverseChainId.Mainnet],
        // No getIsUniswapXSupported provided
      })

      const result = getProtocolsFilter(allProtocols, UniverseChainId.Mainnet)
      expect(result).toContain(TradingApi.ProtocolItems.UNISWAPX_V2)
    })

    it('handles present getIsUniswapXSupported (combines with feature flag)', () => {
      mockGetFeatureFlag.mockImplementation((flag: FeatureFlags) => {
        return flag === FeatureFlags.UniswapX // Feature flag is enabled
      })

      const getIsUniswapXSupported = jest.fn(() => false) // But chain support says no

      const getProtocolsFilter = createGetProtocolsForChain({
        getEnabledChains: () => [UniverseChainId.Mainnet],
        getIsUniswapXSupported,
      })

      const result = getProtocolsFilter(allProtocols, UniverseChainId.Mainnet)
      // Should not contain UniswapX because chain support returned false
      expect(result).not.toContain(TradingApi.ProtocolItems.UNISWAPX_V2)
      expect(getIsUniswapXSupported).toHaveBeenCalledWith(UniverseChainId.Mainnet)
    })

    it('correctly creates V4 swap enabled checker', () => {
      const mockGetV4SwapAllowed = jest.fn((chainId?: number) => chainId === UniverseChainId.Mainnet)
      mockCreateGetV4SwapEnabled.mockReturnValue(mockGetV4SwapAllowed)

      const getProtocolsFilter = createGetProtocolsForChain({
        getEnabledChains: () => [UniverseChainId.Mainnet, UniverseChainId.Polygon],
      })

      // Test Mainnet (V4 allowed)
      const mainnetResult = getProtocolsFilter(allProtocols, UniverseChainId.Mainnet)
      expect(mainnetResult).toContain(TradingApi.ProtocolItems.V4)

      // Test Polygon (V4 not allowed)
      const polygonResult = getProtocolsFilter(allProtocols, UniverseChainId.Polygon)
      expect(polygonResult).not.toContain(TradingApi.ProtocolItems.V4)
    })

    it('returns expected protocols for various chain/flag combinations', () => {
      // Setup: UniswapX enabled, no special flags
      mockGetFeatureFlag.mockImplementation((flag: FeatureFlags) => {
        return flag === FeatureFlags.UniswapX
      })
      mockCreateGetV4SwapEnabled.mockReturnValue(() => true)

      const getProtocolsFilter = createGetProtocolsForChain({
        getEnabledChains: () => [UniverseChainId.Mainnet, UniverseChainId.Base],
        getIsUniswapXSupported: () => true,
      })

      // Mainnet should have all protocols (it's in LAUNCHED_UNISWAPX_CHAINS)
      const mainnetResult = getProtocolsFilter(allProtocols, UniverseChainId.Mainnet)
      expect(mainnetResult).toEqual(allProtocols)

      // Base should not have UniswapX (not in LAUNCHED_UNISWAPX_CHAINS and no priority flag)
      mockGetFeatureFlag.mockImplementation((flag: FeatureFlags) => {
        if (flag === FeatureFlags.UniswapX) {
          return true
        }
        if (flag === FeatureFlags.UniswapXPriorityOrdersBase) {
          return false
        }
        return false
      })

      const baseResult = getProtocolsFilter(allProtocols, UniverseChainId.Base)
      expect(baseResult).toEqual([
        TradingApi.ProtocolItems.V4,
        TradingApi.ProtocolItems.V3,
        TradingApi.ProtocolItems.V2,
      ])
    })
  })
})

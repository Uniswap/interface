import { FeatureFlags } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger as loggerUtil } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { FeatureFlagService } from 'wallet/src/features/transactions/executeTransaction/services/featureFlagService'
import { createTransactionConfigService } from 'wallet/src/features/transactions/executeTransaction/services/transactionConfigServiceImpl'

// Mock the logger
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}))

// Mock the providers utils
jest.mock('wallet/src/features/providers/utils', () => ({
  isPrivateRpcSupportedOnChain: jest.fn(),
}))

describe('TransactionConfigService', () => {
  let mockFeatureFlagService: jest.Mocked<FeatureFlagService>
  let mockLogger: jest.Mocked<typeof loggerUtil>
  let mockIsPrivateRpcSupportedOnChain: jest.MockedFunction<typeof isPrivateRpcSupportedOnChain>
  let transactionConfigService: ReturnType<typeof createTransactionConfigService>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create mock feature flag service
    mockFeatureFlagService = {
      isFeatureEnabled: jest.fn(),
      getExperimentValue: jest.fn(),
    }

    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setDatadogEnabled: jest.fn(),
    } as jest.Mocked<typeof loggerUtil>

    // Setup mock for isPrivateRpcSupportedOnChain
    mockIsPrivateRpcSupportedOnChain = isPrivateRpcSupportedOnChain as jest.MockedFunction<
      typeof isPrivateRpcSupportedOnChain
    >

    // Create service instance
    transactionConfigService = createTransactionConfigService({
      featureFlagService: mockFeatureFlagService,
      logger: mockLogger,
    })
  })

  describe('isPrivateRpcEnabled', () => {
    it('should return true when PrivateRpc feature flag is enabled', () => {
      mockFeatureFlagService.isFeatureEnabled.mockReturnValue(true)

      const result = transactionConfigService.isPrivateRpcEnabled()

      expect(result).toBe(true)
      expect(mockFeatureFlagService.isFeatureEnabled).toHaveBeenCalledWith(FeatureFlags.PrivateRpc)
    })

    it('should return false when PrivateRpc feature flag is disabled', () => {
      mockFeatureFlagService.isFeatureEnabled.mockReturnValue(false)

      const result = transactionConfigService.isPrivateRpcEnabled()

      expect(result).toBe(false)
      expect(mockFeatureFlagService.isFeatureEnabled).toHaveBeenCalledWith(FeatureFlags.PrivateRpc)
    })

    it('should return false and log warning when feature flag service throws an error', () => {
      const error = new Error('Feature flag service error')
      mockFeatureFlagService.isFeatureEnabled.mockImplementation(() => {
        throw error
      })

      const result = transactionConfigService.isPrivateRpcEnabled()

      expect(result).toBe(false)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'TransactionConfigService',
        'isPrivateRpcEnabled',
        'Error checking feature flag',
        {
          error: 'Feature flag service error',
        },
      )
    })
  })

  describe('getTransactionTimeoutMs', () => {
    it('should return 10 minutes for Mainnet', () => {
      const result = transactionConfigService.getTransactionTimeoutMs({ chainId: UniverseChainId.Mainnet })

      expect(result).toBe(10 * 60 * 1000) // 10 minutes in milliseconds
    })

    it('should return 1 minute for non-Mainnet chains', () => {
      const result = transactionConfigService.getTransactionTimeoutMs({ chainId: UniverseChainId.ArbitrumOne })

      expect(result).toBe(60 * 1000) // 1 minute in milliseconds
    })

    it('should return 1 minute for Optimism', () => {
      const result = transactionConfigService.getTransactionTimeoutMs({ chainId: UniverseChainId.Optimism })

      expect(result).toBe(60 * 1000) // 1 minute in milliseconds
    })

    it('should return 1 minute for Polygon', () => {
      const result = transactionConfigService.getTransactionTimeoutMs({ chainId: UniverseChainId.Polygon })

      expect(result).toBe(60 * 1000) // 1 minute in milliseconds
    })

    it('should return 1 minute for Base', () => {
      const result = transactionConfigService.getTransactionTimeoutMs({ chainId: UniverseChainId.Base })

      expect(result).toBe(60 * 1000) // 1 minute in milliseconds
    })
  })

  describe('shouldUsePrivateRpc', () => {
    beforeEach(() => {
      // Setup default mock behavior
      mockFeatureFlagService.isFeatureEnabled.mockReturnValue(true)
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)
    })

    it('should return true when all conditions are met: submitViaPrivateRpc=true, private RPC enabled, and chain supports private RPC', () => {
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.Mainnet,
        submitViaPrivateRpc: true,
      })

      expect(result).toBe(true)
      expect(mockIsPrivateRpcSupportedOnChain).toHaveBeenCalledWith(UniverseChainId.Mainnet)
    })

    it('should return false when submitViaPrivateRpc is false, even if private RPC is enabled and chain supports private RPC', () => {
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.Mainnet,
        submitViaPrivateRpc: false,
      })

      expect(result).toBe(false)
    })

    it('should return false when submitViaPrivateRpc is undefined, even if private RPC is enabled and chain supports private RPC', () => {
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.Mainnet,
        // submitViaPrivateRpc is undefined (default)
      })

      expect(result).toBe(false)
    })

    it('should return false when private RPC is disabled, even if submitViaPrivateRpc=true and chain supports private RPC', () => {
      mockFeatureFlagService.isFeatureEnabled.mockReturnValue(false)
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.Mainnet,
        submitViaPrivateRpc: true,
      })

      expect(result).toBe(false)
    })

    it('should return false when chain does not support private RPC, even if submitViaPrivateRpc=true and private RPC is enabled', () => {
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(false)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.ArbitrumOne,
        submitViaPrivateRpc: true,
      })

      expect(result).toBe(false)
      expect(mockIsPrivateRpcSupportedOnChain).toHaveBeenCalledWith(UniverseChainId.ArbitrumOne)
    })

    it('should return false when all conditions are false: submitViaPrivateRpc=false, private RPC disabled, and chain does not support private RPC', () => {
      mockFeatureFlagService.isFeatureEnabled.mockReturnValue(false)
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(false)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.ArbitrumOne,
        submitViaPrivateRpc: false,
      })

      expect(result).toBe(false)
    })

    it('should handle error in isPrivateRpcEnabled and still return false', () => {
      // Make isPrivateRpcEnabled throw an error (which should return false internally)
      mockFeatureFlagService.isFeatureEnabled.mockImplementation(() => {
        throw new Error('Feature flag error')
      })
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.Mainnet,
        submitViaPrivateRpc: true,
      })

      expect(result).toBe(false)
    })

    it('should work correctly for different chains that support private RPC', () => {
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(true)

      // Test with a different chain that supports private RPC
      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.Polygon,
        submitViaPrivateRpc: true,
      })

      expect(result).toBe(true)
      expect(mockIsPrivateRpcSupportedOnChain).toHaveBeenCalledWith(UniverseChainId.Polygon)
    })

    it('should return false for chains that do not support private RPC regardless of other conditions', () => {
      mockIsPrivateRpcSupportedOnChain.mockReturnValue(false)

      const result = transactionConfigService.shouldUsePrivateRpc({
        chainId: UniverseChainId.Base,
        submitViaPrivateRpc: true,
      })

      expect(result).toBe(false)
      expect(mockIsPrivateRpcSupportedOnChain).toHaveBeenCalledWith(UniverseChainId.Base)
    })
  })
})

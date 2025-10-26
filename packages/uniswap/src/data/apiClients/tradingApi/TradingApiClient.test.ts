// Mock the global fetch function
const mockFetch = jest.fn()
global.fetch = mockFetch

import { TradingApi } from '@universe/api'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

// Helper function to create a mock Response
const createMockResponse = (data: TradingApi.WalletCheckDelegationResponseBody): Partial<Response> => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue(data),
})

const mockCheckWalletDelegationWithoutBatching = mockFetch

describe('checkWalletDelegation', () => {
  const mockAddress1 = '0x1234567890abcdef1234567890abcdef12345678' as Address
  const mockAddress2 = '0xabcdef1234567890abcdef1234567890abcdef12' as Address
  const mockAddress3 = '0x9876543210fedcba9876543210fedcba98765432' as Address

  const mockChainId1 = 1 as TradingApi.ChainId
  const mockChainId2 = 137 as TradingApi.ChainId

  const mockDelegationResponse: TradingApi.WalletCheckDelegationResponseBody = {
    requestId: 'test-request-id',
    delegationDetails: {
      [mockAddress1]: {
        '1': {
          isWalletDelegatedToUniswap: true,
          currentDelegationAddress: '0xdeadbeef',
          latestDelegationAddress: '0xdeadbeef',
        },
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when no wallet addresses are provided', () => {
    it('should return empty delegation details without making API call', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [],
        chainIds: [mockChainId1],
      }

      const result = await checkWalletDelegation(params)

      expect(result).toEqual({
        requestId: '',
        delegationDetails: {},
      })
      expect(mockCheckWalletDelegationWithoutBatching).not.toHaveBeenCalled()
    })

    it('should return empty delegation details when walletAddresses is undefined', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        chainIds: [mockChainId1],
      }

      const result = await checkWalletDelegation(params)

      expect(result).toEqual({
        requestId: '',
        delegationDetails: {},
      })
      expect(mockCheckWalletDelegationWithoutBatching).not.toHaveBeenCalled()
    })
  })

  describe('when request is under batch threshold', () => {
    it('should make single API call for small request', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1],
        chainIds: [mockChainId1],
      }

      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(createMockResponse(mockDelegationResponse))

      const result = await checkWalletDelegation(params)

      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(1)
      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(params),
        }),
      )
      expect(result).toEqual(mockDelegationResponse)
    })

    it('should make single API call when total combinations equal threshold', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1],
        chainIds: [mockChainId1],
      }

      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(createMockResponse(mockDelegationResponse))

      // Set threshold to exactly match the combinations (1 wallet * 1 chain = 1)
      const result = await checkWalletDelegation(params, 1)

      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockDelegationResponse)
    })
  })

  describe('when request exceeds batch threshold', () => {
    it('should split into multiple batches and merge responses', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1, mockAddress2, mockAddress3],
        chainIds: [mockChainId1, mockChainId2],
      }

      const response1: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'batch-1',
        delegationDetails: {
          [mockAddress1]: {
            '1': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xdeadbeef',
              latestDelegationAddress: '0xdeadbeef',
            },
            '137': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xfeedface',
            },
          },
        },
      }

      const response2: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'batch-2',
        delegationDetails: {
          [mockAddress2]: {
            '1': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xdeadbeef',
            },
            '137': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xfeedface',
              latestDelegationAddress: '0xfeedface',
            },
          },
        },
      }

      const response3: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'batch-3',
        delegationDetails: {
          [mockAddress3]: {
            '1': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xbadcafe',
              latestDelegationAddress: '0xbadcafe',
            },
            '137': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xcafebabe',
            },
          },
        },
      }

      mockCheckWalletDelegationWithoutBatching
        .mockResolvedValueOnce(createMockResponse(response1))
        .mockResolvedValueOnce(createMockResponse(response2))
        .mockResolvedValueOnce(createMockResponse(response3))

      // Set threshold to 2 (should create 3 batches: 1 wallet per batch since 1 wallet * 2 chains = 2)
      const result = await checkWalletDelegation(params, 2)

      const expectedMergedResponse: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: response1.requestId,
        delegationDetails: {
          ...response1.delegationDetails,
          ...response2.delegationDetails,
          ...response3.delegationDetails,
        },
      }

      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(3)
      expect(result).toEqual(expectedMergedResponse)
    })

    it('should handle batching with custom threshold', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1, mockAddress2],
        chainIds: [mockChainId1, mockChainId2],
      }

      const response1: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'batch-1',
        delegationDetails: {
          [mockAddress1]: {
            '1': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xdeadbeef',
              latestDelegationAddress: '0xdeadbeef',
            },
            '137': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xfeedface',
            },
          },
        },
      }

      const response2: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'batch-2',
        delegationDetails: {
          [mockAddress2]: {
            '1': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xdeadbeef',
            },
            '137': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xfeedface',
              latestDelegationAddress: '0xfeedface',
            },
          },
        },
      }

      mockCheckWalletDelegationWithoutBatching
        .mockResolvedValueOnce(createMockResponse(response1))
        .mockResolvedValueOnce(createMockResponse(response2))

      // 2 wallets * 2 chains = 4 combinations, threshold = 3, so should batch
      const result = await checkWalletDelegation(params, 3)

      const expectedMergedResponse: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: response1.requestId,
        delegationDetails: {
          ...response1.delegationDetails,
          ...response2.delegationDetails,
        },
      }

      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(2)
      expect(result).toEqual(expectedMergedResponse)
    })
  })

  describe('edge cases', () => {
    it('should handle empty response properly', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1],
        chainIds: [mockChainId1],
      }

      const emptyResponse: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'empty-request',
        delegationDetails: {},
      }

      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(createMockResponse(emptyResponse))

      const result = await checkWalletDelegation(params)

      expect(result).toEqual(emptyResponse)
    })

    it('should handle single wallet with multiple chains', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1],
        chainIds: [mockChainId1, mockChainId2],
      }

      const response: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'multi-chain',
        delegationDetails: {
          [mockAddress1]: {
            '1': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xdeadbeef',
              latestDelegationAddress: '0xdeadbeef',
            },
            '137': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xfeedface',
            },
          },
        },
      }

      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(createMockResponse(response))

      const result = await checkWalletDelegation(params)

      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(1)
      expect(result).toEqual(response)
    })

    it('should handle multiple wallets with single chain', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1, mockAddress2],
        chainIds: [mockChainId1],
      }

      const response: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'multi-wallet',
        delegationDetails: {
          [mockAddress1]: {
            '1': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xdeadbeef',
              latestDelegationAddress: '0xdeadbeef',
            },
          },
          [mockAddress2]: {
            '1': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xdeadbeef',
            },
          },
        },
      }

      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(createMockResponse(response))

      const result = await checkWalletDelegation(params)

      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(1)
      expect(result).toEqual(response)
    })
  })

  describe('error handling', () => {
    it('should propagate API errors', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1],
        chainIds: [mockChainId1],
      }

      const apiError = new Error('API Error')
      mockCheckWalletDelegationWithoutBatching.mockRejectedValue(apiError)

      await expect(checkWalletDelegation(params)).rejects.toThrow('API Error')
    })

    it('should use chainIds.length as effective threshold when batchThreshold is smaller', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1],
        chainIds: [mockChainId1, mockChainId2], // 2 chains
      }

      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(createMockResponse(mockDelegationResponse))

      // Pass batchThreshold of 1, which is less than chainIds.length (2)
      // Should use 2 as effective threshold (1 wallet * 2 chains = 2, which equals effective threshold)
      const result = await checkWalletDelegation(params, 1)

      // Should make a single API call since combinations (2) equals effective threshold (2)
      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockDelegationResponse)
    })

    it('should handle partial batch failures', async () => {
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: [mockAddress1, mockAddress2],
        chainIds: [mockChainId1, mockChainId2],
      }

      const response1: TradingApi.WalletCheckDelegationResponseBody = {
        requestId: 'batch-1',
        delegationDetails: {
          [mockAddress1]: {
            '1': {
              isWalletDelegatedToUniswap: true,
              currentDelegationAddress: '0xdeadbeef',
              latestDelegationAddress: '0xdeadbeef',
            },
            '137': {
              isWalletDelegatedToUniswap: false,
              currentDelegationAddress: null,
              latestDelegationAddress: '0xfeedface',
            },
          },
        },
      }

      mockCheckWalletDelegationWithoutBatching
        .mockResolvedValueOnce(createMockResponse(response1))
        .mockRejectedValueOnce(new Error('Batch 2 failed'))

      // Should fail if any batch fails
      await expect(checkWalletDelegation(params, 2)).rejects.toThrow('Batch 2 failed')
    })
  })

  describe('default threshold behavior', () => {
    it('should use default threshold when not provided', async () => {
      // Create a request that would exceed the default threshold (140)
      const manyWallets = Array.from({ length: 15 }, (_, i) => `0x${i.toString().padStart(40, '0')}` as Address)
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: manyWallets,
        chainIds: [
          mockChainId1,
          mockChainId2,
          42 as TradingApi.ChainId,
          56 as TradingApi.ChainId,
          100 as TradingApi.ChainId,
        ], // 5 chains
      }

      // 15 wallets * 5 chains = 75 combinations, under default threshold of 140, should be single call
      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(
        createMockResponse({
          requestId: 'single-call',
          delegationDetails: {},
        }),
      )

      await checkWalletDelegation(params)

      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(1)
    })

    it('should batch when exceeding default threshold', async () => {
      // Create a request that would exceed the default threshold (140)
      const manyWallets = Array.from({ length: 30 }, (_, i) => `0x${i.toString().padStart(40, '0')}` as Address)
      const params: TradingApi.WalletCheckDelegationRequestBody = {
        walletAddresses: manyWallets,
        chainIds: [
          mockChainId1, // 1 (Ethereum)
          mockChainId2, // 137 (Polygon)
          10 as TradingApi.ChainId, // Optimism
          56 as TradingApi.ChainId, // BNB
          42161 as TradingApi.ChainId, // Arbitrum - using a supported chain instead of 100
        ], // 5 supported EVM chains
      }

      // 30 wallets * 5 chains = 150 combinations, exceeds default threshold of 140, should batch
      mockCheckWalletDelegationWithoutBatching.mockResolvedValue(
        createMockResponse({
          requestId: 'batch-response',
          delegationDetails: {},
        }),
      )

      await checkWalletDelegation(params)

      // Should make multiple calls (150 combinations / 5 chains = 30 wallets, but max per batch is 140/5 = 28)
      expect(mockCheckWalletDelegationWithoutBatching).toHaveBeenCalledTimes(2)
    })
  })
})

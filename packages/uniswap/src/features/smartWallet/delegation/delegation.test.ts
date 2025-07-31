import { createDelegationService } from 'uniswap/src/features/smartWallet/delegation/delegation'
import type { Logger } from 'utilities/src/logger/logger'

describe('delegation service', () => {
  const wallet = '0xWallet'
  const delegatedAddress = '0xDelegated'

  describe('checking delegation status', () => {
    it('knows when a wallet is delegated', async () => {
      const onDelegationDetected = jest.fn()
      const service = createDelegationService({
        delegationRepository: {
          getWalletDelegations: async () => ({
            '1': {
              currentDelegationAddress: delegatedAddress,
              isWalletDelegatedToUniswap: true,
              latestDelegationAddress: '0xLatest',
            },
          }),
        },
        onDelegationDetected,
      })

      const result = await service.getAddressDelegations({
        address: wallet,
        chainIds: [1],
      })

      expect(result['1']).toEqual({
        isDelegated: true,
        delegatedAddress,
      })
      expect(onDelegationDetected).toHaveBeenCalledWith({
        address: delegatedAddress,
        chainId: 1,
      })
    })

    it('knows when a wallet is not delegated', async () => {
      const service = createDelegationService({
        delegationRepository: {
          getWalletDelegations: async () => ({ '1': null }),
        },
      })

      const result = await service.getAddressDelegations({
        address: wallet,
        chainIds: [1],
      })

      expect(result['1']).toEqual({
        isDelegated: false,
        delegatedAddress: null,
      })
    })

    it('handles multiple chains at once', async () => {
      const service = createDelegationService({
        delegationRepository: {
          getWalletDelegations: async () => ({
            '1': {
              currentDelegationAddress: '0xDelegated1',
              isWalletDelegatedToUniswap: true,
              latestDelegationAddress: '0xLatest',
            },
            '137': null,
            '10': {
              currentDelegationAddress: '0xDelegated10',
              isWalletDelegatedToUniswap: false,
              latestDelegationAddress: '0xLatest',
            },
          }),
        },
      })

      const result = await service.getAddressDelegations({
        address: wallet,
        chainIds: [1, 137, 10],
      })

      expect(result).toEqual({
        '1': { isDelegated: true, delegatedAddress: '0xDelegated1' },
        '137': { isDelegated: false, delegatedAddress: null },
        '10': { isDelegated: true, delegatedAddress: '0xDelegated10' },
      })
    })

    it('handles empty responses gracefully', async () => {
      const service = createDelegationService({
        delegationRepository: {
          getWalletDelegations: async () => ({
            '1': {
              currentDelegationAddress: null,
              isWalletDelegatedToUniswap: false,
              latestDelegationAddress: '0xLatest',
            },
          }),
        },
      })

      const result = await service.getAddressDelegations({
        address: wallet,
        chainIds: [1],
      })

      expect(result['1']?.isDelegated).toBe(false)
    })
  })

  describe('error handling', () => {
    it('returns empty results when repository fails', async () => {
      const logger = { debug: jest.fn(), error: jest.fn() } as unknown as Logger
      const service = createDelegationService({
        logger,
        delegationRepository: {
          getWalletDelegations: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      })

      const result = await service.getAddressDelegations({
        address: wallet,
        chainIds: [1, 137],
      })

      expect(result).toEqual({})
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('single chain convenience method', () => {
    it('works just like the multi-chain method', async () => {
      const service = createDelegationService({
        delegationRepository: {
          getWalletDelegations: async () => ({
            '1': {
              currentDelegationAddress: delegatedAddress,
              isWalletDelegatedToUniswap: true,
              latestDelegationAddress: '0xLatest',
            },
          }),
        },
      })

      const result = await service.getIsAddressDelegated({
        address: wallet,
        chainId: 1,
      })

      expect(result).toEqual({
        isDelegated: true,
        delegatedAddress,
      })
    })

    it('returns non-delegated on errors', async () => {
      const service = createDelegationService({
        logger: { debug: jest.fn(), error: jest.fn() } as unknown as Logger,
        delegationRepository: {
          getWalletDelegations: jest.fn().mockRejectedValue(new Error('Failed')),
        },
      })

      const result = await service.getIsAddressDelegated({
        address: wallet,
        chainId: 1,
      })

      expect(result).toEqual({
        isDelegated: false,
        delegatedAddress: null,
      })
    })
  })
})

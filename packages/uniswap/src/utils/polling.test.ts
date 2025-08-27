import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { POLLING_CONSTANTS, shouldCheckTransaction, withTimeout } from 'uniswap/src/utils/polling'

describe('polling utilities', () => {
  describe('shouldCheckTransaction', () => {
    const baseTransaction: Pick<TransactionDetails, 'receipt' | 'lastCheckedBlockNumber' | 'addedTime'> = {
      addedTime: Date.now(),
      receipt: undefined,
      lastCheckedBlockNumber: undefined,
    }

    it('returns true if no receipt and never checked', () => {
      expect(shouldCheckTransaction(10, baseTransaction)).toEqual(true)
    })

    it('returns false if has receipt and never checked', () => {
      const mockReceipt = {
        transactionIndex: 0,
        blockHash: '0x123',
        blockNumber: 12345,
        confirmedTime: Date.now(),
        gasUsed: 21000,
        effectiveGasPrice: 20000000000,
      }
      expect(shouldCheckTransaction(10, { ...baseTransaction, receipt: mockReceipt })).toEqual(false)
    })

    it('returns true if has not been checked in 1 blocks', () => {
      expect(
        shouldCheckTransaction(10, {
          ...baseTransaction,
          lastCheckedBlockNumber: 9,
        }),
      ).toEqual(true)
    })

    it('returns false if checked in last 3 blocks and greater than 5 minutes old', () => {
      const oldTransaction = {
        ...baseTransaction,
        addedTime: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        lastCheckedBlockNumber: 8,
      }
      expect(shouldCheckTransaction(10, oldTransaction)).toEqual(false)
    })

    it('returns true if not checked in last 3 blocks and greater than 5 minutes old', () => {
      const oldTransaction = {
        ...baseTransaction,
        addedTime: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        lastCheckedBlockNumber: 5,
      }
      expect(shouldCheckTransaction(10, oldTransaction)).toEqual(true)
    })

    it('returns false if checked in last 10 blocks and greater than 60 minutes old', () => {
      const veryOldTransaction = {
        ...baseTransaction,
        addedTime: Date.now() - 61 * 60 * 1000, // 61 minutes ago
        lastCheckedBlockNumber: 11,
      }
      expect(shouldCheckTransaction(20, veryOldTransaction)).toEqual(false)
    })

    it('returns true if checked in last 10 blocks and greater than 60 minutes old', () => {
      const veryOldTransaction = {
        ...baseTransaction,
        addedTime: Date.now() - 61 * 60 * 1000, // 61 minutes ago
        lastCheckedBlockNumber: 10,
      }
      expect(shouldCheckTransaction(20, veryOldTransaction)).toEqual(true)
    })
  })

  describe('POLLING_CONSTANTS', () => {
    it('has correct default values', () => {
      expect(POLLING_CONSTANTS.POLL_INTERVAL).toBe(2000)
      expect(POLLING_CONSTANTS.MAX_POLLING_TIME).toBe(5 * 60 * 1000)
      expect(POLLING_CONSTANTS.BLOCKS_BEFORE_CHECK.RECENT).toBe(1)
      expect(POLLING_CONSTANTS.BLOCKS_BEFORE_CHECK.MEDIUM).toBe(3)
      expect(POLLING_CONSTANTS.BLOCKS_BEFORE_CHECK.OLD).toBe(10)
      expect(POLLING_CONSTANTS.TIME_THRESHOLDS_MINUTES.MEDIUM).toBe(5)
      expect(POLLING_CONSTANTS.TIME_THRESHOLDS_MINUTES.OLD).toBe(60)
    })
  })

  describe('withTimeout', () => {
    it('resolves when promise resolves before timeout', async () => {
      const promise = Promise.resolve('success')
      const result = await withTimeout(promise, {
        timeoutMs: 1000,
        errorMsg: 'Timeout',
      })
      expect(result).toBe('success')
    })

    it('rejects with timeout error when promise takes too long', async () => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('success'), 100)
      })
      await expect(
        withTimeout(promise, {
          timeoutMs: 50,
          errorMsg: 'Custom timeout error',
        }),
      ).rejects.toThrow('Custom timeout error')
    })

    it('rejects with original error when promise rejects', async () => {
      const promise = Promise.reject(new Error('Original error'))
      await expect(
        withTimeout(promise, {
          timeoutMs: 1000,
          errorMsg: 'Timeout',
        }),
      ).rejects.toThrow('Original error')
    })
  })
})

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMergeLocalAndRemoteTransactions } from 'uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { type TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TEST_WALLET } from 'uniswap/src/test/fixtures/wallet/addresses'
import {
  extractInputSwapTransactionInfo,
  transactionDetails,
  uniswapXOrderDetails,
} from 'uniswap/src/test/fixtures/wallet/transactions'
import { renderHook } from 'uniswap/src/test/test-utils'

// Mock dependencies
jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: jest.fn(),
}))

import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

describe('useMergeLocalAndRemoteTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useEnabledChains as jest.Mock).mockReturnValue({
      chains: [UniverseChainId.Mainnet],
    })
  })

  // Helper to create transaction with common defaults
  const createTestTransaction = (overrides = {}) =>
    transactionDetails({
      chainId: UniverseChainId.Mainnet,
      from: TEST_WALLET,
      typeInfo: extractInputSwapTransactionInfo(),
      ...overrides,
    })

  // Helper to create UniswapX order with common defaults
  const createTestOrder = (overrides = {}) =>
    uniswapXOrderDetails({
      chainId: UniverseChainId.Mainnet,
      from: TEST_WALLET,
      ...overrides,
    })

  // Helper to render hook with common setup
  const renderMergeHook = (
    remoteTransactions: TransactionDetails[] | undefined,
    localTransactions: TransactionDetails[] = [],
  ) => {
    const preloadedState = localTransactions.length
      ? {
          transactions: localTransactions.reduce<Record<string, Record<number, Record<string, TransactionDetails>>>>(
            (acc, tx) => ({
              ...acc,
              [TEST_WALLET]: {
                ...acc[TEST_WALLET],
                [tx.chainId]: {
                  ...acc[TEST_WALLET]?.[tx.chainId],
                  [tx.id]: tx,
                },
              },
            }),
            {},
          ),
        }
      : { transactions: {} }

    return renderHook(
      () =>
        useMergeLocalAndRemoteTransactions({
          evmAddress: TEST_WALLET,
          remoteTransactions,
        }),
      { preloadedState },
    )
  }

  describe('when only remote transactions exist', () => {
    it('should return remote transactions', () => {
      const remoteTx = createTestTransaction({ status: TransactionStatus.Success, hash: '0xremote123' })
      const { result } = renderMergeHook([remoteTx])

      expect(result.current).toEqual([remoteTx])
    })
  })

  describe('when only local transactions exist', () => {
    it('should return local transactions', () => {
      const localTx = createTestTransaction({ status: TransactionStatus.Pending, hash: '0xlocal123' })
      const { result } = renderMergeHook(undefined, [localTx])

      expect(result.current).toEqual([localTx])
    })
  })

  describe('when transactions have the same hash', () => {
    it('should use remote data when remote transaction is successful', () => {
      const SHARED_HASH = '0xsharedhash123'
      const localTx = createTestTransaction({ hash: SHARED_HASH, status: TransactionStatus.Pending })
      const remoteTx = createTestTransaction({
        hash: SHARED_HASH,
        status: TransactionStatus.Success,
        receipt: {
          blockNumber: 12345,
          confirmedTime: Date.now(),
          transactionIndex: 1,
          blockHash: '0xblock',
          gasUsed: 21000,
          effectiveGasPrice: 100,
        },
      })

      const { result } = renderMergeHook([remoteTx], [localTx])

      expect(result.current).toHaveLength(1)
      expect(result.current?.[0]).toBe(remoteTx)
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Success)
    })

    it('should use local data when remote transaction failed', () => {
      const SHARED_HASH = '0xfailedhash456'
      const networkFee = {
        quantity: '0.001',
        tokenSymbol: 'ETH',
        tokenAddress: '0xnative',
        chainId: UniverseChainId.Mainnet,
      }
      const localTx = createTestTransaction({ hash: SHARED_HASH, status: TransactionStatus.Pending })
      const remoteTx = createTestTransaction({
        hash: SHARED_HASH,
        status: TransactionStatus.Failed,
        networkFee,
      })

      const { result } = renderMergeHook([remoteTx], [localTx])

      expect(result.current).toHaveLength(1)
      // Should merge local data with remote status and networkFee when remote failed
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Failed)
      expect(result.current?.[0]?.networkFee).toEqual(networkFee)
    })

    it('should dispatch finalizeTransaction when local tx is not finalized but remote is', () => {
      const SHARED_HASH = '0xfinalizehash'
      const localTx = createTestTransaction({ hash: SHARED_HASH, status: TransactionStatus.Pending })
      const remoteTx = createTestTransaction({
        hash: SHARED_HASH,
        status: TransactionStatus.Success,
        networkFee: {
          quantity: '0.001',
          tokenSymbol: 'ETH',
          tokenAddress: '0xnative',
          chainId: UniverseChainId.Mainnet,
        },
      })

      const { store } = renderMergeHook([remoteTx], [localTx])

      // Check that the local transaction was finalized in the store
      const state = store.getState()
      const chainTransactions = state.transactions[TEST_WALLET]
      expect(chainTransactions).toBeDefined()
      const finalizedTx = chainTransactions?.[UniverseChainId.Mainnet]?.[localTx.id]
      expect(finalizedTx?.status).toBe(TransactionStatus.Success)
    })
  })

  describe('when transactions have different hashes', () => {
    it('should keep both transactions', () => {
      const localTx = createTestTransaction({ hash: '0xlocalhash', status: TransactionStatus.Pending })
      const remoteTx = createTestTransaction({ hash: '0xremotehash', status: TransactionStatus.Success })

      const { result } = renderMergeHook([remoteTx], [localTx])

      expect(result.current).toHaveLength(2)
      expect(result.current?.find((tx) => tx.hash === '0xlocalhash')).toBeDefined()
      expect(result.current?.find((tx) => tx.hash === '0xremotehash')).toBeDefined()
    })

    it('should keep both transactions when they have same nonce but different hashes', () => {
      const localTx = createTestTransaction({
        hash: '0xhash1',
        status: TransactionStatus.Pending,
      })
      const remoteTx = createTestTransaction({
        hash: '0xhash2',
        status: TransactionStatus.Success,
      })

      const { result } = renderMergeHook([remoteTx], [localTx])

      // Both transactions should be present since deduplication is hash-based, not nonce-based
      expect(result.current).toHaveLength(2)
      expect(result.current?.find((tx) => tx.hash === '0xhash1')).toBeDefined()
      expect(result.current?.find((tx) => tx.hash === '0xhash2')).toBeDefined()
    })
  })

  describe('cancelled transactions', () => {
    it('should prefer local cancelled status over remote success', () => {
      const SHARED_HASH = '0xcancelledhash'
      const networkFee = {
        quantity: '0.001',
        tokenSymbol: 'ETH',
        tokenAddress: '0xnative',
        chainId: UniverseChainId.Mainnet,
      }
      const localTx = createTestTransaction({ hash: SHARED_HASH, status: TransactionStatus.Canceled })
      const remoteTx = createTestTransaction({
        hash: SHARED_HASH,
        status: TransactionStatus.Success,
        networkFee,
      })

      const { result } = renderMergeHook([remoteTx], [localTx])

      expect(result.current).toHaveLength(1)
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Canceled)
      expect(result.current?.[0]?.networkFee).toEqual(networkFee)
    })
  })

  describe('UniswapX order deduplication', () => {
    it('should deduplicate orders using orderHash', () => {
      const ORDER_HASH = '0xorderhash123'
      const FILL_HASH = '0xfillhash456'

      const localOrder = createTestOrder({
        orderHash: ORDER_HASH,
        hash: undefined,
        status: TransactionStatus.Pending,
      })

      const remoteOrder = createTestOrder({
        orderHash: ORDER_HASH,
        hash: FILL_HASH,
        status: TransactionStatus.Success,
      })

      const { result } = renderMergeHook([remoteOrder], [localOrder])

      // Should deduplicate and return only the filled order
      expect(result.current).toHaveLength(1)
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Success)
      expect(result.current?.[0]?.hash).toBe(FILL_HASH)
    })
  })
})

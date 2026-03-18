/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { TradeType } from '@uniswap/sdk-core'
import { useMergeLocalAndRemoteTransactions } from 'uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import {
  PlanTransactionDetails,
  type TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TEST_WALLET } from 'uniswap/src/test/fixtures/wallet/addresses'
import {
  extractInputSwapTransactionInfo,
  transactionDetails,
  uniswapXOrderDetails,
} from 'uniswap/src/test/fixtures/wallet/transactions'
import { act, renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

// Mock dependencies
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

describe('useMergeLocalAndRemoteTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useEnabledChains as Mock).mockReturnValue({
      chains: [UniverseChainId.Mainnet],
    })
    // Reset the activePlanStore between tests
    activePlanStore.getState().actions.resetActivePlan()
    activePlanStore.getState().actions.resetBackgroundedPlans()
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
      // Hook preserves local addedTime (user submission time) instead of remote's block timestamp
      expect(result.current?.[0]).toEqual({ ...remoteTx, addedTime: localTx.addedTime })
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Success)
    })

    it('should use local data when remote transaction failed', () => {
      const SHARED_HASH = '0xfailedhash456'
      const networkFee = {
        quantity: '0.001',
        tokenSymbol: 'ETH',
        tokenAddress: '0xnative',
        chainId: UniverseChainId.Mainnet,
        valueType: ValueType.Exact,
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
          valueType: ValueType.Exact,
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
        valueType: ValueType.Exact,
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

  describe('Plan step transaction filtering', () => {
    it('should filter out transactions that are part of a plan stepDetails', () => {
      const STEP_HASH_1 = '0xstephash1'
      const STEP_HASH_2 = '0xstephash2'
      const PLAN_ID = 'plan-123'

      // Create a Plan transaction with stepDetails containing step hashes
      const planTx: TransactionDetails = {
        id: PLAN_ID,
        chainId: UniverseChainId.Mainnet,
        from: TEST_WALLET,
        status: TransactionStatus.Success,
        addedTime: Date.now(),
        routing: 'CHAINED' as any,
        options: { request: {} },
        updatedTime: Date.now(),
        transactionOriginType: 'internal' as any,
        typeInfo: {
          type: TransactionType.Plan,
          planId: PLAN_ID,
          planStatus: undefined,
          stepDetails: [
            {
              id: 'step-1',
              chainId: UniverseChainId.Mainnet,
              from: TEST_WALLET,
              hash: STEP_HASH_1,
              status: TransactionStatus.Success,
              addedTime: Date.now(),
              routing: 'CLASSIC' as any,
              options: { request: {} },
              transactionOriginType: 'internal' as any,
              typeInfo: extractInputSwapTransactionInfo(),
            },
            {
              id: 'step-2',
              chainId: UniverseChainId.Mainnet,
              from: TEST_WALLET,
              hash: STEP_HASH_2,
              status: TransactionStatus.Success,
              addedTime: Date.now(),
              routing: 'CLASSIC' as any,
              options: { request: {} },
              transactionOriginType: 'internal' as any,
              typeInfo: extractInputSwapTransactionInfo(),
            },
          ],
          tokenOutChainId: UniverseChainId.Mainnet,
          inputCurrencyId: '1-0x123',
          outputCurrencyId: '1-0x456',
          inputCurrencyAmountRaw: '1000000',
          outputCurrencyAmountRaw: '2000000',
          tradeType: TradeType.EXACT_INPUT,
        },
      }

      // Create individual step transactions that should be filtered out
      const stepTx1 = createTestTransaction({ hash: STEP_HASH_1, status: TransactionStatus.Success })
      const stepTx2 = createTestTransaction({ hash: STEP_HASH_2, status: TransactionStatus.Success })

      // Create an unrelated transaction that should NOT be filtered
      const unrelatedTx = createTestTransaction({ hash: '0xunrelated', status: TransactionStatus.Success })

      const { result } = renderMergeHook([planTx, stepTx1, stepTx2, unrelatedTx])

      // Should only return the plan transaction and the unrelated transaction
      // Step transactions should be filtered out
      expect(result.current).toHaveLength(2)
      expect(result.current?.find((tx) => tx.typeInfo.type === TransactionType.Plan)).toBeDefined()
      expect(result.current?.find((tx) => tx.hash === '0xunrelated')).toBeDefined()
      // Step transactions should NOT be in the result
      expect(result.current?.find((tx) => tx.hash === STEP_HASH_1)).toBeUndefined()
      expect(result.current?.find((tx) => tx.hash === STEP_HASH_2)).toBeUndefined()
    })

    it('should not filter transactions when no plan exists', () => {
      // Regular transactions without any plan
      const tx1 = createTestTransaction({ hash: '0xhash1', status: TransactionStatus.Success })
      const tx2 = createTestTransaction({ hash: '0xhash2', status: TransactionStatus.Success })

      const { result } = renderMergeHook([tx1, tx2])

      // Both should be present
      expect(result.current).toHaveLength(2)
      expect(result.current?.find((tx) => tx.hash === '0xhash1')).toBeDefined()
      expect(result.current?.find((tx) => tx.hash === '0xhash2')).toBeDefined()
    })
  })

  describe('Plan transaction merging', () => {
    // Helper to create a Plan transaction
    const createPlanTransaction = (
      overrides: Partial<TransactionDetails> & { planId: string; updatedTime: number },
    ) => {
      const { planId, updatedTime, ...rest } = overrides
      return {
        id: planId,
        chainId: UniverseChainId.Mainnet,
        from: TEST_WALLET,
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
        routing: 'CHAINED' as any,
        options: { request: {} },
        updatedTime,
        transactionOriginType: 'internal' as any,
        typeInfo: {
          type: TransactionType.Plan,
          planId,
          planStatus: undefined,
          stepDetails: [],
          tokenOutChainId: UniverseChainId.Mainnet,
          inputCurrencyId: '1-0x123',
          outputCurrencyId: '1-0x456',
          inputCurrencyAmountRaw: '1000000',
          outputCurrencyAmountRaw: '2000000',
          tradeType: TradeType.EXACT_INPUT,
        },
        ...rest,
      } as TransactionDetails
    }

    it('should use remote Plan when remote updatedTime is newer', () => {
      const PLAN_ID = 'plan-merge-test-1'
      const NOW = Date.now()
      const OLDER_THAN_NOW = NOW - 1000

      const localPlan = createPlanTransaction({
        planId: PLAN_ID,
        updatedTime: OLDER_THAN_NOW,
        status: TransactionStatus.Pending,
      })
      const remotePlan = createPlanTransaction({
        planId: PLAN_ID,
        updatedTime: NOW,
        status: TransactionStatus.Success,
      })

      const { result, store } = renderMergeHook([remotePlan], [localPlan])
      expect(result.current).toHaveLength(1)
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Success)
      expect((result.current?.[0] as PlanTransactionDetails).updatedTime).toBe(NOW)
      const state = store.getState()
      const storedPlan = state.transactions[TEST_WALLET]?.[UniverseChainId.Mainnet]?.[PLAN_ID]
      expect(storedPlan?.status).toBe(TransactionStatus.Success)
    })

    it('should use local Plan when local updatedTime is newer', () => {
      const PLAN_ID = 'plan-merge-test-2'
      const NOW = Date.now()
      const OLDER_THAN_NOW = NOW - 1000

      const localPlan = createPlanTransaction({
        planId: PLAN_ID,
        updatedTime: NOW,
        status: TransactionStatus.Pending,
      })
      const remotePlan = createPlanTransaction({
        planId: PLAN_ID,
        updatedTime: OLDER_THAN_NOW,
        status: TransactionStatus.Success,
      })

      const { result, store } = renderMergeHook([remotePlan], [localPlan])
      expect(result.current).toHaveLength(1)
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Pending)
      expect((result.current?.[0] as PlanTransactionDetails).updatedTime).toBe(NOW)
      const state = store.getState()
      const storedPlan = state.transactions[TEST_WALLET]?.[UniverseChainId.Mainnet]?.[PLAN_ID]
      expect(storedPlan?.status).toBe(TransactionStatus.Pending)
    })

    it('should sort Plan transactions by updatedTime instead of addedTime', () => {
      const NOW = Date.now()

      // Plan with older addedTime but newer updatedTime (should appear first)
      const plan1 = createPlanTransaction({
        planId: 'plan-1',
        addedTime: NOW - 5000,
        updatedTime: NOW, // Most recent update
        status: TransactionStatus.Success,
      })

      // Plan with newer addedTime but older updatedTime (should appear second)
      const plan2 = createPlanTransaction({
        planId: 'plan-2',
        addedTime: NOW,
        updatedTime: NOW - 2000, // Older update
        status: TransactionStatus.Pending,
      })

      const { result } = renderMergeHook([plan1, plan2])

      // Should be sorted by updatedTime (newest first), not addedTime
      expect(result.current).toHaveLength(2)
      expect((result.current?.[0] as any)?.typeInfo?.planId).toBe('plan-1')
      expect((result.current?.[1] as any)?.typeInfo?.planId).toBe('plan-2')
    })

    it('should sort mixed Plan and regular transactions correctly', () => {
      const NOW = Date.now()
      const OLDER_THAN_NOW = NOW - 1000
      const EVEN_OLDER_THAN_NOW = OLDER_THAN_NOW - 1000

      const remoteRegularTx: TransactionDetails = {
        id: 'regular-tx-1',
        chainId: UniverseChainId.Mainnet,
        from: TEST_WALLET,
        hash: '0xregular',
        status: TransactionStatus.Success,
        addedTime: OLDER_THAN_NOW,
        routing: 'CLASSIC' as any,
        options: { request: {} },
        transactionOriginType: 'internal' as any,
        typeInfo: extractInputSwapTransactionInfo(),
      }

      const remotePlanTx = createPlanTransaction({
        planId: 'plan-mixed',
        addedTime: OLDER_THAN_NOW, // should be ignored
        updatedTime: NOW,
        status: TransactionStatus.Success,
      })

      const localTx = createTestTransaction({
        hash: '0xlocal',
        status: TransactionStatus.Pending,
        addedTime: EVEN_OLDER_THAN_NOW, // should be ignored
      })

      const { result } = renderMergeHook([remoteRegularTx, remotePlanTx], [localTx])

      expect(result.current).toHaveLength(3)
      expect(result.current![0]!.id).toBe(remotePlanTx.id)
      expect(result.current![1]!.hash).toBe('0xregular')
      expect(result.current![2]!.hash).toBe('0xlocal')
    })
  })

  describe('activePlanStore reactivity', () => {
    // Helper to create a Plan transaction (reused from above scope)
    const createPlanTx = (planId: string, status: TransactionStatus) => {
      return {
        id: planId,
        chainId: UniverseChainId.Mainnet,
        from: TEST_WALLET,
        status,
        addedTime: Date.now(),
        routing: 'CHAINED' as any,
        options: { request: {} },
        updatedTime: Date.now(),
        transactionOriginType: 'internal' as any,
        typeInfo: {
          type: TransactionType.Plan,
          planId,
          planStatus: undefined,
          stepDetails: [],
          tokenOutChainId: UniverseChainId.Mainnet,
          inputCurrencyId: '1-0x123',
          outputCurrencyId: '1-0x456',
          inputCurrencyAmountRaw: '1000000',
          outputCurrencyAmountRaw: '2000000',
          tradeType: TradeType.EXACT_INPUT,
        },
      } as TransactionDetails
    }

    it('should re-render when a plan is cleared from backgroundedPlans, restoring AwaitingAction status', () => {
      const PLAN_ID = 'plan-reactivity-test'

      const planTx = createPlanTx(PLAN_ID, TransactionStatus.AwaitingAction)

      // Put the plan in backgroundedPlans (simulating a backgrounded saga still running)
      const fakePlanData = {
        response: {} as any,
        planId: PLAN_ID,
        inputChainId: UniverseChainId.Mainnet,
        steps: [],
        proofPending: false,
        currentStepIndex: 0,
      }
      activePlanStore.getState().actions.setActivePlan(fakePlanData)
      activePlanStore.getState().actions.backgroundPlan(PLAN_ID)

      const { result } = renderMergeHook([planTx])

      // While backgrounded, AwaitingAction should be overridden to Pending
      expect(result.current).toHaveLength(1)
      expect(result.current?.[0]?.status).toBe(TransactionStatus.Pending)

      // Simulate saga completion: clear the plan from the store
      act(() => {
        activePlanStore.getState().actions.clearPlan(PLAN_ID)
      })

      // After clearing, the real AwaitingAction status should flow through
      expect(result.current?.[0]?.status).toBe(TransactionStatus.AwaitingAction)
    })
  })
})

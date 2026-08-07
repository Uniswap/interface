import { configureStore, Store } from '@reduxjs/toolkit'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import {
  CANCEL_TX_TIMEOUT_MS,
  ORPHAN_CANCEL_TIMEOUT_MS,
} from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import {
  addTransaction,
  cancelTransaction,
  checkedTransaction,
  finalizeTransaction,
  initialTransactionsState,
  interfaceApplyTransactionHashToBatch,
  interfaceCancelTransaction,
  interfaceClearAllTransactions,
  interfaceConfirmBridgeDeposit,
  interfaceUpdateTransactionInfo,
  orderCancelBroadcasted,
  orderCancelFailed,
  orderCancelTxMined,
  replaceTransaction,
  revertCancelSwap,
  stampCancelAlertShown,
  stampOrphanCancelTimeout,
  TransactionsState,
  transactionReducer,
  updateTransaction,
} from 'uniswap/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  ConfirmedSwapTransactionInfo,
  FinalizedTransactionDetails,
  InterfaceTransactionDetails,
  TransactionDetails,
  TransactionNetworkFee,
  TransactionOptions,
  TransactionOriginType,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { finalizedTransactionAction, uniswapXOrderDetails } from 'uniswap/src/test/fixtures'

const finalizedTxAction = finalizedTransactionAction()

const address = '0x123'

const approveTxTypeInfo: TransactionTypeInfo = {
  type: TransactionType.Approve,
  tokenAddress: '0xabc',
  spender: '0xdef',
}

const swapTxTypeInfo: TransactionTypeInfo = {
  type: TransactionType.Swap,
  inputCurrencyId: '0xabc',
  outputCurrencyId: '0xdef',
  inputCurrencyAmountRaw: '1000000000000000000',
  outputCurrencyAmountRaw: '1000000000000000000',
}

const approveTxRequest: TransactionOptions = {
  request: {
    from: address,
    to: '0x456',
    value: '0x0',
  },
}

const baseApproveTx: TransactionDetails = {
  id: 'tx1',
  chainId: UniverseChainId.Mainnet,
  from: address,
  status: TransactionStatus.Pending,
  hash: undefined,
  routing: TradingApi.Routing.CLASSIC,
  options: approveTxRequest,
  typeInfo: approveTxTypeInfo,
  addedTime: Date.now(),
  transactionOriginType: TransactionOriginType.Internal,
}

const baseInterfaceApproveTx: InterfaceTransactionDetails = {
  ...baseApproveTx,
  hash: '0xhash',
}

const baseBridgeTx: TransactionDetails = {
  id: 'tx1',
  chainId: UniverseChainId.Mainnet,
  from: address,
  status: TransactionStatus.Pending,
  hash: '0xhash',
  routing: TradingApi.Routing.BRIDGE,
  options: approveTxRequest,
  typeInfo: {
    type: TransactionType.Bridge,
    inputCurrencyId: '0xabc',
    inputCurrencyAmountRaw: '1000000000000000000',
    outputCurrencyId: '0xdef',
    outputCurrencyAmountRaw: '1000000000000000000',
  },
  addedTime: Date.now(),
  transactionOriginType: TransactionOriginType.Internal,
}

const baseSwapTx: TransactionDetails = {
  id: 'tx1',
  chainId: UniverseChainId.Mainnet,
  from: address,
  status: TransactionStatus.Pending,
  hash: '0xhash',
  routing: TradingApi.Routing.CLASSIC,
  options: approveTxRequest,
  typeInfo: swapTxTypeInfo,
  addedTime: Date.now(),
  transactionOriginType: TransactionOriginType.Internal,
}

describe('transaction reducer', () => {
  let store: Store<TransactionsState>

  beforeEach(() => {
    store = configureStore({ reducer: transactionReducer, preloadedState: initialTransactionsState })
  })

  describe('addTransaction', () => {
    it('adds the transaction', () => {
      const beforeTime = new Date().getTime()
      store.dispatch(
        addTransaction({
          ...baseApproveTx,
          id: '0',
          hash: '0x0',
          addedTime: Date.now(),
        }),
      )
      const txs = store.getState()[address]
      expect(txs?.[UniverseChainId.Mainnet]).toBeTruthy()
      expect(txs?.[UniverseChainId.Mainnet]?.['0']).toBeTruthy()
      const tx = txs?.[UniverseChainId.Mainnet]?.['0']
      expect(tx).toBeTruthy()
      expect(tx?.hash).toEqual('0x0')
      expect(tx?.from).toEqual(address)
      expect(tx?.addedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx?.typeInfo).toEqual(approveTxTypeInfo)
    })

    it('throws if attempting to add a transaction that already exists', () => {
      const id = '5'
      const chainId = UniverseChainId.Mainnet
      store.dispatch(
        addTransaction({
          ...baseApproveTx,
          chainId,
          id,
          hash: '0x0',
        }),
      )

      try {
        store.dispatch(
          addTransaction({
            ...baseApproveTx,
            chainId,
            id,
            hash: '0x0',
          }),
        )
      } catch (error) {
        expect(error).toEqual(Error(`addTransaction: Attempted to overwrite tx with id ${id}`))
      }
    })
  })

  describe('updateTransaction', () => {
    it('throws if attempting to update a missing transaction', () => {
      const id = '2'
      const chainId = UniverseChainId.Polygon
      try {
        store.dispatch(
          updateTransaction({
            ...baseApproveTx,
            chainId,
            id,
            hash: '0x0',
          }),
        )
      } catch (error) {
        expect(error).toEqual(Error(`updateTransaction: Attempted to update a missing tx with id ${id}`))
      }
      expect(store.getState()).toEqual({})
    })

    it('updates a transaction that was previously added', () => {
      const id = '19'
      const chainId = UniverseChainId.Polygon as UniverseChainId
      const transaction = {
        ...baseApproveTx,
        chainId,
        id,
        hash: '0x0',
      } as const

      store.dispatch(addTransaction(transaction))
      store.dispatch(updateTransaction({ ...transaction, status: TransactionStatus.Canceled }))
      const tx = store.getState()[address]?.[chainId]?.[id]
      expect(tx?.status).toEqual(TransactionStatus.Canceled)
    })
  })

  describe('finalizeTransaction', () => {
    it('throws if attempting to finalize a missing transaction', () => {
      try {
        store.dispatch(finalizeTransaction(finalizedTxAction.payload))
      } catch (error) {
        expect(error).toEqual(
          Error(
            `finalizeTransaction: Attempted to access a missing transaction with id ${finalizedTxAction.payload.id}`,
          ),
        )
      }
      expect(store.getState()).toEqual({})
    })

    const { from, chainId, id, receipt } = finalizedTxAction.payload
    it('finalizes a transaction that was previously added', () => {
      store.dispatch(
        addTransaction({
          ...baseApproveTx,
          chainId,
          id,
          hash: '0x0',
          from,
        }),
      )
      store.dispatch(finalizeTransaction(finalizedTxAction.payload))
      const tx = store.getState()[from]?.[chainId]?.[id]
      expect((tx as TransactionDetails).receipt).toEqual(receipt)
    })

    describe('interface scenarios', () => {
      const dummyReceipt: TransactionReceipt = {
        transactionIndex: 0,
        blockHash: '0xabc',
        blockNumber: 1,
        confirmedTime: Date.now(),
        gasUsed: 21000,
        effectiveGasPrice: 1,
      }

      it('finalizes an interface transaction with network fee', () => {
        const networkFee: TransactionNetworkFee = {
          quantity: '1000000000000000000',
          tokenSymbol: 'ETH',
          tokenAddress: '0x0000000000000000000000000000000000000000',
          chainId: UniverseChainId.Mainnet,
          valueType: ValueType.Exact,
        }

        store.dispatch(addTransaction(baseInterfaceApproveTx))
        const finalized: FinalizedTransactionDetails = {
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          from: address,
          status: TransactionStatus.Success,
          typeInfo: approveTxTypeInfo,
          networkFee,
          receipt: dummyReceipt,
          hash: '0xhash',
          transactionOriginType: TransactionOriginType.Internal,
          addedTime: Date.now(),
        } as unknown as FinalizedTransactionDetails
        store.dispatch(finalizeTransaction(finalized))

        const tx = store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1'] as InterfaceTransactionDetails
        expect(tx.status).toEqual(TransactionStatus.Success)
        expect(tx.networkFee).toEqual(networkFee)
        expect(tx.receipt?.confirmedTime).toBeDefined()
      })

      it('finalizes an interface transaction without network fee', () => {
        store.dispatch(addTransaction(baseInterfaceApproveTx))
        const finalizedNoFee: FinalizedTransactionDetails = {
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          from: address,
          status: TransactionStatus.Success,
          typeInfo: approveTxTypeInfo,
          receipt: dummyReceipt,
          hash: '0xhash',
          transactionOriginType: TransactionOriginType.Internal,
          addedTime: Date.now(),
        } as unknown as FinalizedTransactionDetails
        store.dispatch(finalizeTransaction(finalizedNoFee))

        const tx = store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1'] as InterfaceTransactionDetails
        expect(tx.status).toEqual(TransactionStatus.Success)
        expect(tx.networkFee).toBeUndefined()
        expect(tx.receipt?.confirmedTime).toBeDefined()
      })
    })
  })

  describe('cancelTransaction', () => {
    it('throws if attempting to cancel a missing transaction', () => {
      const id = '13'
      try {
        store.dispatch(
          cancelTransaction({
            address: '0xaddress',
            chainId: UniverseChainId.Optimism,
            cancelRequest: {},
            id,
          }),
        )
      } catch (error) {
        expect(error).toEqual(Error(`cancelTransaction: Attempted to access a missing transaction with id ${id}`))
      }
      expect(store.getState()).toEqual({})
    })

    it('cancels a transaction that was previously added', () => {
      const id = '420'
      const chainId = UniverseChainId.ArbitrumOne

      store.dispatch(
        addTransaction({
          ...baseApproveTx,
          chainId,
          id,
          hash: '0x0',
          from: address,
        }),
      )
      store.dispatch(cancelTransaction({ chainId, id, address, cancelRequest: {} }))
      const tx = store.getState()[address]?.[chainId]?.[id]
      expect(tx?.status).toEqual(TransactionStatus.Cancelling)
    })
  })

  describe('cancel CAS reducers', () => {
    const orderId = 'order-1'
    const chainId = UniverseChainId.Mainnet
    const baseOrder: UniswapXOrderDetails = {
      ...uniswapXOrderDetails(),
      id: orderId,
      chainId,
      from: address,
      status: TransactionStatus.Cancelling,
    }
    const cancelTxHash = '0xcanceltx'
    const broadcastTimeMs = 1_700_000_000_000

    const getOrder = (): UniswapXOrderDetails | undefined =>
      store.getState()[address]?.[chainId]?.[orderId] as UniswapXOrderDetails | undefined

    describe('orderCancelBroadcasted', () => {
      it('records the cancel tx and starts the persisted T1 deadline', () => {
        store.dispatch(addTransaction(baseOrder))
        store.dispatch(orderCancelBroadcasted({ address, chainId, id: orderId, cancelTxHash, broadcastTimeMs }))
        const tx = getOrder()
        expect(tx?.cancelTxHash).toEqual(cancelTxHash)
        expect(tx?.cancelBroadcastTimeMs).toEqual(broadcastTimeMs)
        expect(tx?.cancelTimeoutAtMs).toEqual(broadcastTimeMs + CANCEL_TX_TIMEOUT_MS)
      })

      it('no-ops unless the order is still Cancelling (stale-clobber guard)', () => {
        store.dispatch(addTransaction({ ...baseOrder, status: TransactionStatus.Success }))
        store.dispatch(orderCancelBroadcasted({ address, chainId, id: orderId, cancelTxHash, broadcastTimeMs }))
        const tx = getOrder()
        expect(tx?.status).toEqual(TransactionStatus.Success)
        expect(tx?.cancelTxHash).toBeUndefined()
      })
    })

    describe('orderCancelFailed', () => {
      it('restores the captured pre-cancel status and clears the cancel fields', () => {
        store.dispatch(
          addTransaction({
            ...baseOrder,
            cancelTxHash,
            cancelBroadcastTimeMs: broadcastTimeMs,
            cancelTimeoutAtMs: broadcastTimeMs + CANCEL_TX_TIMEOUT_MS,
            cancelInitiatedTimeMs: broadcastTimeMs - 1000,
          }),
        )
        store.dispatch(
          orderCancelFailed({
            address,
            chainId,
            id: orderId,
            reason: 'rejected',
            revertToStatus: TransactionStatus.InsufficientFunds,
          }),
        )
        const tx = getOrder()
        expect(tx?.status).toEqual(TransactionStatus.InsufficientFunds)
        expect(tx?.cancelTxHash).toBeUndefined()
        expect(tx?.cancelBroadcastTimeMs).toBeUndefined()
        expect(tx?.cancelTimeoutAtMs).toBeUndefined()
        expect(tx?.cancelInitiatedTimeMs).toBeUndefined()
      })

      it('no-ops when the order already left Cancelling', () => {
        store.dispatch(addTransaction({ ...baseOrder, status: TransactionStatus.Canceled }))
        store.dispatch(
          orderCancelFailed({
            address,
            chainId,
            id: orderId,
            reason: 'broadcast-failed',
            revertToStatus: TransactionStatus.Pending,
          }),
        )
        expect(getOrder()?.status).toEqual(TransactionStatus.Canceled)
      })
    })

    describe('orderCancelTxMined', () => {
      it('marks the cancel tx mined while Cancelling', () => {
        store.dispatch(addTransaction({ ...baseOrder, cancelTxHash }))
        store.dispatch(orderCancelTxMined({ address, chainId, id: orderId }))
        const tx = getOrder()
        expect(tx?.status).toEqual(TransactionStatus.Cancelling)
        expect(tx?.cancelTxMined).toBe(true)
      })

      it('re-enters a reverted Pending order into the cancel flow (fake-Pending killer)', () => {
        store.dispatch(addTransaction({ ...baseOrder, status: TransactionStatus.Pending }))
        store.dispatch(orderCancelTxMined({ address, chainId, id: orderId }))
        const tx = getOrder()
        expect(tx?.status).toEqual(TransactionStatus.Cancelling)
        expect(tx?.cancelTxMined).toBe(true)
      })

      it('never flips an already-final order (filled wins)', () => {
        store.dispatch(addTransaction({ ...baseOrder, status: TransactionStatus.Success }))
        store.dispatch(orderCancelTxMined({ address, chainId, id: orderId }))
        const tx = getOrder()
        expect(tx?.status).toEqual(TransactionStatus.Success)
        expect(tx?.cancelTxMined).toBeUndefined()
      })
    })

    describe('stampOrphanCancelTimeout', () => {
      it('lazily persists the orphan deadline once', () => {
        store.dispatch(addTransaction(baseOrder))
        store.dispatch(stampOrphanCancelTimeout({ address, chainId, id: orderId, nowMs: broadcastTimeMs }))
        const tx = getOrder()
        expect(tx?.cancelInitiatedTimeMs).toEqual(broadcastTimeMs)
        expect(tx?.cancelTimeoutAtMs).toEqual(broadcastTimeMs + ORPHAN_CANCEL_TIMEOUT_MS)

        // Second stamp never restarts the clock
        store.dispatch(stampOrphanCancelTimeout({ address, chainId, id: orderId, nowMs: broadcastTimeMs + 60_000 }))
        expect(getOrder()?.cancelTimeoutAtMs).toEqual(broadcastTimeMs + ORPHAN_CANCEL_TIMEOUT_MS)
      })

      it('no-ops for orders with a broadcast cancel tx', () => {
        store.dispatch(addTransaction({ ...baseOrder, cancelTxHash }))
        store.dispatch(stampOrphanCancelTimeout({ address, chainId, id: orderId, nowMs: broadcastTimeMs }))
        expect(getOrder()?.cancelTimeoutAtMs).toBeUndefined()
      })

      it('anchors T2 at cancelInitiatedTimeMs for new-flow records (mid-approval reload keeps its clock)', () => {
        // Click stamped cancelInitiatedTimeMs 10 minutes ago, then the app reloaded mid-approval:
        // the cure clock must NOT restart at detection — the record is already past T2
        const initiatedAt = broadcastTimeMs - 10 * 60 * 1000
        store.dispatch(addTransaction({ ...baseOrder, cancelInitiatedTimeMs: initiatedAt }))
        store.dispatch(stampOrphanCancelTimeout({ address, chainId, id: orderId, nowMs: broadcastTimeMs }))
        const tx = getOrder()
        expect(tx?.cancelInitiatedTimeMs).toEqual(initiatedAt)
        expect(tx?.cancelTimeoutAtMs).toEqual(initiatedAt + ORPHAN_CANCEL_TIMEOUT_MS)
      })
    })

    describe('stampCancelAlertShown', () => {
      const timedOutFields = {
        cancelTxHash,
        cancelBroadcastTimeMs: broadcastTimeMs - CANCEL_TX_TIMEOUT_MS - 1000,
        cancelTimeoutAtMs: broadcastTimeMs - 1000,
      }

      it('stamps once past the deadline and produces a fresh order reference (memoization buster)', () => {
        store.dispatch(addTransaction({ ...baseOrder, ...timedOutFields }))
        const before = getOrder()
        store.dispatch(stampCancelAlertShown({ address, chainId, id: orderId, nowMs: broadcastTimeMs }))
        const after = getOrder()
        expect(after?.cancelAlertShownAtMs).toEqual(broadcastTimeMs)
        // The write is the whole point: memoized rows re-render only on a new reference
        expect(after).not.toBe(before)

        // Second stamp no-ops (one-shot per deadline)
        store.dispatch(stampCancelAlertShown({ address, chainId, id: orderId, nowMs: broadcastTimeMs + 30_000 }))
        expect(getOrder()?.cancelAlertShownAtMs).toEqual(broadcastTimeMs)
        expect(getOrder()).toBe(after)
      })

      it('refuses before the deadline, once the cancel tx mined, and off-Cancelling', () => {
        store.dispatch(addTransaction({ ...baseOrder, ...timedOutFields, cancelTimeoutAtMs: broadcastTimeMs + 1 }))
        store.dispatch(stampCancelAlertShown({ address, chainId, id: orderId, nowMs: broadcastTimeMs }))
        expect(getOrder()?.cancelAlertShownAtMs).toBeUndefined()

        store.dispatch(updateTransaction({ ...baseOrder, ...timedOutFields, cancelTxMined: true }))
        store.dispatch(stampCancelAlertShown({ address, chainId, id: orderId, nowMs: broadcastTimeMs }))
        expect(getOrder()?.cancelAlertShownAtMs).toBeUndefined()

        store.dispatch(updateTransaction({ ...baseOrder, ...timedOutFields, status: TransactionStatus.Success }))
        store.dispatch(stampCancelAlertShown({ address, chainId, id: orderId, nowMs: broadcastTimeMs }))
        expect(getOrder()?.cancelAlertShownAtMs).toBeUndefined()
      })

      it('is cleared by orderCancelFailed and by the Revert record-swap (fresh deadline → fresh alert cycle)', () => {
        store.dispatch(addTransaction({ ...baseOrder, ...timedOutFields, cancelAlertShownAtMs: broadcastTimeMs - 500 }))
        store.dispatch(revertCancelSwap({ address, chainId, id: orderId, newCancelTxHash: '0xnew', broadcastTimeMs }))
        expect(getOrder()?.cancelAlertShownAtMs).toBeUndefined()

        store.dispatch(
          updateTransaction({ ...baseOrder, ...timedOutFields, cancelAlertShownAtMs: broadcastTimeMs - 500 }),
        )
        store.dispatch(
          orderCancelFailed({
            address,
            chainId,
            id: orderId,
            reason: 'broadcast-failed',
            revertToStatus: TransactionStatus.Pending,
          }),
        )
        expect(getOrder()?.cancelAlertShownAtMs).toBeUndefined()
      })
    })

    describe('revertCancelSwap', () => {
      const timedOutFields = {
        cancelTxHash,
        cancelBroadcastTimeMs: broadcastTimeMs - CANCEL_TX_TIMEOUT_MS - 1000,
        cancelTimeoutAtMs: broadcastTimeMs - 1000,
      }

      it('swaps in the replacement cancel tx and supersedes the old hash', () => {
        store.dispatch(addTransaction({ ...baseOrder, ...timedOutFields }))
        store.dispatch(revertCancelSwap({ address, chainId, id: orderId, newCancelTxHash: '0xnew', broadcastTimeMs }))
        const tx = getOrder()
        expect(tx?.status).toEqual(TransactionStatus.Cancelling)
        expect(tx?.cancelTxHash).toEqual('0xnew')
        expect(tx?.supersededCancelTxHashes).toEqual([cancelTxHash])
        expect(tx?.cancelTimeoutAtMs).toEqual(broadcastTimeMs + CANCEL_TX_TIMEOUT_MS)
      })

      it('refuses the swap when the order is no longer timed-out Cancelling', () => {
        store.dispatch(addTransaction({ ...baseOrder, ...timedOutFields, status: TransactionStatus.Success }))
        store.dispatch(revertCancelSwap({ address, chainId, id: orderId, newCancelTxHash: '0xnew', broadcastTimeMs }))
        const tx = getOrder()
        expect(tx?.cancelTxHash).toEqual(cancelTxHash)
        expect(tx?.supersededCancelTxHashes).toBeUndefined()
      })

      it('refuses the swap when the cancel tx already mined', () => {
        store.dispatch(addTransaction({ ...baseOrder, ...timedOutFields, cancelTxMined: true }))
        store.dispatch(revertCancelSwap({ address, chainId, id: orderId, newCancelTxHash: '0xnew', broadcastTimeMs }))
        expect(getOrder()?.cancelTxHash).toEqual(cancelTxHash)
      })
    })
  })

  describe('replaceTransaction', () => {
    const newTxParams = { gasPrice: '0x123' }

    it('throws if attempting to replace a missing transaction', () => {
      const id = '2'
      try {
        store.dispatch(
          replaceTransaction({
            address: '0xaddress',
            chainId: UniverseChainId.Optimism,
            id,
            newTxParams,
          }),
        )
      } catch (error) {
        expect(error).toEqual(Error(`replaceTransaction: Attempted to replace a tx that doesn't exist with id ${id}`))
      }
      expect(store.getState()).toEqual({})
    })

    it('replaces a transaction that was previously added', () => {
      const id = '101'
      const chainId = UniverseChainId.Optimism as UniverseChainId
      const transaction = {
        ...baseApproveTx,
        chainId,
        id,
        hash: '0x0',
        from: address,
      } as const

      store.dispatch(addTransaction(transaction))
      store.dispatch(replaceTransaction({ chainId, id, newTxParams, address }))
      const tx = store.getState()[address]?.[chainId]?.[id]
      expect(tx?.status).toEqual(TransactionStatus.Replacing)
    })
  })

  describe('interfaceClearAllTransactions', () => {
    it('should clear all transactions for a specific chain and address', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseInterfaceApproveTx,
            tx2: {
              ...baseInterfaceApproveTx,
              id: 'tx2',
              status: TransactionStatus.Success,
            },
          },
          [UniverseChainId.Optimism]: {
            tx3: {
              ...baseInterfaceApproveTx,
              id: 'tx3',
              chainId: UniverseChainId.Optimism,
              status: TransactionStatus.Pending,
            },
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(interfaceClearAllTransactions({ chainId: UniverseChainId.Mainnet, address }))

      expect(store.getState()[address]?.[UniverseChainId.Mainnet]).toEqual({})
      expect(store.getState()[address]?.[UniverseChainId.Optimism]).toEqual(
        initialState[address]?.[UniverseChainId.Optimism],
      ) // Should remain unchanged
    })

    it('should do nothing if chain does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseInterfaceApproveTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(interfaceClearAllTransactions({ chainId: UniverseChainId.Optimism, address }))
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceClearAllTransactions: Attempted to access a missing transaction with id tx1`),
        )
      }

      expect(store.getState()).toEqual(initialState)
    })

    it('should do nothing if address does not exist', () => {
      const nonExistentAddress = '0xnonexistentaddress'
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseApproveTx,
          },
        },
      }
      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(interfaceClearAllTransactions({ chainId: UniverseChainId.Mainnet, address: nonExistentAddress }))
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceClearAllTransactions: Attempted to access a missing transaction with id tx1`),
        )
      }
      expect(store.getState()).toEqual(initialState)
    })
  })

  describe('checkedTransaction', () => {
    it('should update lastCheckedBlockNumber for pending transaction', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: {
              ...baseApproveTx,
              lastCheckedBlockNumber: 100,
            },
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        checkedTransaction({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          blockNumber: 150,
        }),
      )

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1'] as TransactionDetails).lastCheckedBlockNumber,
      ).toBe(150)
    })

    it('should set lastCheckedBlockNumber if not already set', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseApproveTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        checkedTransaction({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          blockNumber: 100,
        }),
      )

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1'] as TransactionDetails).lastCheckedBlockNumber,
      ).toBe(100)
    })

    it('should update lastCheckedBlockNumber to max value when called multiple times', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseApproveTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        checkedTransaction({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          blockNumber: 100,
        }),
      )
      store.dispatch(
        checkedTransaction({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          blockNumber: 150,
        }),
      )

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1'] as TransactionDetails).lastCheckedBlockNumber,
      ).toBe(150)
    })

    it('should not update non-pending transaction', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: {
              ...baseApproveTx,
              status: TransactionStatus.Success,
              lastCheckedBlockNumber: 100,
            },
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      expect(() => {
        store.dispatch(
          checkedTransaction({
            chainId: UniverseChainId.Mainnet,
            id: 'tx1',
            address,
            blockNumber: 150,
          }),
        )
      }).toThrow('checkedTransaction: Attempted to check a non-pending transaction with id tx1')

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1'] as TransactionDetails).lastCheckedBlockNumber,
      ).toBe(100) // Should remain unchanged
    })

    it('should do nothing if transaction does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseApproveTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(
          checkedTransaction({
            chainId: UniverseChainId.Mainnet,
            id: 'nonexistent',
            address,
            blockNumber: 150,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`checkedTransaction: Attempted to access a missing transaction with id nonexistent`),
        )
      }

      expect(store.getState()).toEqual(initialState)
    })
  })

  describe('interfaceConfirmBridgeDeposit', () => {
    it('should mark bridge transaction as deposit confirmed', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseBridgeTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        interfaceConfirmBridgeDeposit({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
        }),
      )

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1']?.typeInfo as BridgeTransactionInfo)
          .depositConfirmed,
      ).toBe(true)
    })

    it('should not update non-bridge transaction', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseSwapTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(
          interfaceConfirmBridgeDeposit({
            chainId: UniverseChainId.Mainnet,
            id: 'tx1',
            address,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceConfirmBridgeDeposit: Attempted to confirm a non-bridge transaction with id tx1`),
        )
      }

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1']?.typeInfo as BridgeTransactionInfo)
          .depositConfirmed,
      ).toBeUndefined()
    })

    it('should do nothing if transaction does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseBridgeTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(
          interfaceConfirmBridgeDeposit({
            chainId: UniverseChainId.Mainnet,
            id: 'nonexistent',
            address,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceConfirmBridgeDeposit: Attempted to access a missing transaction with id nonexistent`),
        )
      }

      expect(store.getState()).toEqual(initialState)
    })
  })

  describe('interfaceUpdateTransactionInfo', () => {
    it('should update transaction typeInfo', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: {
              ...baseSwapTx,
              typeInfo: {
                ...swapTxTypeInfo,
                inputCurrencyId: 'old',
              },
            },
          },
        },
      }

      const newTypeInfo: ConfirmedSwapTransactionInfo = {
        ...swapTxTypeInfo,
        inputCurrencyId: 'new',
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        interfaceUpdateTransactionInfo({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          typeInfo: newTypeInfo,
        }),
      )

      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1']?.typeInfo).toEqual(newTypeInfo)
    })

    it('should not update if transaction type does not match', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseSwapTx,
          },
        },
      }

      const newTypeInfo: ApproveTransactionInfo = {
        type: TransactionType.Approve,
        tokenAddress: address,
        spender: '0x456',
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(
          interfaceUpdateTransactionInfo({
            chainId: UniverseChainId.Mainnet,
            id: 'tx1',
            address,
            typeInfo: newTypeInfo,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceUpdateTransactionInfo: Attempted to update a non-matching transaction with id tx1`),
        )
      }

      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1']?.typeInfo).toEqual(
        initialState[address]?.[UniverseChainId.Mainnet]?.['tx1']?.typeInfo,
      ) // Should remain unchanged
    })

    it('should do nothing if transaction does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseSwapTx,
          },
        },
      }

      const newTypeInfo: ConfirmedSwapTransactionInfo = {
        ...swapTxTypeInfo,
        inputCurrencyId: 'new',
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(
          interfaceUpdateTransactionInfo({
            chainId: UniverseChainId.Mainnet,
            id: 'nonexistent',
            address,
            typeInfo: newTypeInfo,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceUpdateTransactionInfo: Attempted to access a missing transaction with id nonexistent`),
        )
      }

      expect(store.getState()).toEqual(initialState)
    })

    it('should do nothing if address does not exist in state', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseSwapTx,
          },
        },
      }

      const newTypeInfo: ConfirmedSwapTransactionInfo = {
        ...swapTxTypeInfo,
        inputCurrencyId: 'new',
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(
          interfaceUpdateTransactionInfo({
            chainId: UniverseChainId.Mainnet,
            id: 'tx1',
            address: '0xnonexistent',
            typeInfo: newTypeInfo,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceUpdateTransactionInfo: Attempted to access a missing transaction with id tx1`),
        )
      }

      expect(store.getState()).toEqual(initialState)
    })

    it('should do nothing if chainId does not exist for address', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseSwapTx,
          },
        },
      }

      const newTypeInfo: ConfirmedSwapTransactionInfo = {
        ...swapTxTypeInfo,
        inputCurrencyId: 'new',
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      try {
        store.dispatch(
          interfaceUpdateTransactionInfo({
            chainId: UniverseChainId.Polygon,
            id: 'tx1',
            address,
            typeInfo: newTypeInfo,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceUpdateTransactionInfo: Attempted to access a missing transaction with id tx1`),
        )
      }

      expect(store.getState()).toEqual(initialState)
    })
  })

  describe('interfaceApplyTransactionHashToBatch', () => {
    it('should replace batch transaction with hash transaction', () => {
      const initialState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            batch1: {
              ...baseApproveTx,
              id: 'batch1',
              hash: undefined,
            },
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        interfaceApplyTransactionHashToBatch({
          batchId: 'batch1',
          hash: '0xhash',
          chainId: UniverseChainId.Mainnet,
          address,
        }),
      )

      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['0xhash']).toBeDefined()
      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['0xhash']?.hash).toBe('0xhash')
      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['batch1']).toBeUndefined()
    })

    it('should do nothing if batch transaction does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseApproveTx,
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        interfaceApplyTransactionHashToBatch({
          batchId: 'nonexistent',
          hash: '0xhash',
          chainId: UniverseChainId.Mainnet,
          address,
        }),
      )

      expect(store.getState()).toEqual(initialState)
    })
  })

  describe('interfaceCancelTransaction', () => {
    it('should update existing transaction with cancelled status and new hash', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: {
              ...baseApproveTx,
              hash: '0xold',
            },
          },
        },
      }

      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })
      store.dispatch(
        interfaceCancelTransaction({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          cancelHash: '0xnew',
        }),
      )

      // The transaction should still exist under the same ID
      const cancelledTx: InterfaceTransactionDetails | undefined =
        store.getState()[address]?.[UniverseChainId.Mainnet]?.['tx1']
      expect(cancelledTx).toBeDefined()
      expect(cancelledTx?.id).toBe('tx1')
      expect(cancelledTx?.hash).toBe('0xnew')
      expect(cancelledTx?.status).toBe(TransactionStatus.Canceled)
    })

    it('should not modify state when transaction does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: {
              ...baseApproveTx,
              hash: '0xold',
            },
          },
        },
      }
      store = configureStore({ reducer: transactionReducer, preloadedState: initialState })

      try {
        store.dispatch(
          interfaceCancelTransaction({
            chainId: UniverseChainId.Mainnet,
            id: 'nonexistent',
            address,
            cancelHash: '0xnew',
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceCancelTransaction: Attempted to access a missing transaction with id nonexistent`),
        )
      }
      expect(store.getState()).toEqual(initialState)
    })
  })
})

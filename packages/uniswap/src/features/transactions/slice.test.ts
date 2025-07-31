/* eslint-disable max-lines */
import { createStore, Store } from '@reduxjs/toolkit'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  addTransaction,
  cancelTransaction,
  finalizeTransaction,
  initialTransactionsState,
  interfaceApplyTransactionHashToBatch,
  interfaceCancelTransactionWithHash,
  interfaceCheckedTransaction,
  interfaceClearAllTransactions,
  interfaceConfirmBridgeDeposit,
  interfaceUpdateTransactionInfo,
  replaceTransaction,
  transactionReducer,
  TransactionsState,
  updateTransaction,
} from 'uniswap/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  ConfirmedSwapTransactionInfo,
  InterfaceTransactionDetails,
  TransactionDetails,
  TransactionOptions,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { finalizedTransactionAction } from 'uniswap/src/test/fixtures'

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
  routing: Routing.CLASSIC,
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
  routing: Routing.BRIDGE,
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
  routing: Routing.CLASSIC,
  options: approveTxRequest,
  typeInfo: swapTxTypeInfo,
  addedTime: Date.now(),
  transactionOriginType: TransactionOriginType.Internal,
}

describe('transaction reducer', () => {
  let store: Store<TransactionsState>

  beforeEach(() => {
    store = createStore(transactionReducer, initialTransactionsState)
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

      store = createStore(transactionReducer, initialState)
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

      store = createStore(transactionReducer, initialState)
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
      store = createStore(transactionReducer, initialState)
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

  describe('interfaceCheckedTransaction', () => {
    it('should update lastCheckedBlockNumber for pending transaction', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: {
              ...baseInterfaceApproveTx,
              lastCheckedBlockNumber: 100,
            },
          },
        },
      }

      store = createStore(transactionReducer, initialState)
      store.dispatch(
        interfaceCheckedTransaction({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          blockNumber: 150,
        }),
      )

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1 as InterfaceTransactionDetails)
          .lastCheckedBlockNumber,
      ).toBe(150)
    })

    it('should set lastCheckedBlockNumber if not already set', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseInterfaceApproveTx,
          },
        },
      }

      store = createStore(transactionReducer, initialState)
      store.dispatch(
        interfaceCheckedTransaction({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          blockNumber: 100,
        }),
      )

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1 as InterfaceTransactionDetails)
          .lastCheckedBlockNumber,
      ).toBe(100)
    })

    it('should not update non-pending transaction', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: {
              ...baseInterfaceApproveTx,
              status: TransactionStatus.Success,
              lastCheckedBlockNumber: 100,
            },
          },
        },
      }

      store = createStore(transactionReducer, initialState)
      try {
        store.dispatch(
          interfaceCheckedTransaction({
            chainId: UniverseChainId.Mainnet,
            id: 'tx1',
            address,
            blockNumber: 150,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceCheckedTransaction: Attempted to check a non-pending transaction with id tx1`),
        )
      }

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1 as InterfaceTransactionDetails)
          .lastCheckedBlockNumber,
      ).toBe(100) // Should remain unchanged
    })

    it('should do nothing if transaction does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseInterfaceApproveTx,
          },
        },
      }

      store = createStore(transactionReducer, initialState)
      try {
        store.dispatch(
          interfaceCheckedTransaction({
            chainId: UniverseChainId.Mainnet,
            id: 'nonexistent',
            address,
            blockNumber: 150,
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceCheckedTransaction: Attempted to access a missing transaction with id nonexistent`),
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

      store = createStore(transactionReducer, initialState)
      store.dispatch(
        interfaceConfirmBridgeDeposit({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
        }),
      )

      expect(
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1?.typeInfo as BridgeTransactionInfo).depositConfirmed,
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

      store = createStore(transactionReducer, initialState)
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
        (store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1?.typeInfo as BridgeTransactionInfo).depositConfirmed,
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

      store = createStore(transactionReducer, initialState)
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

      store = createStore(transactionReducer, initialState)
      store.dispatch(
        interfaceUpdateTransactionInfo({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          typeInfo: newTypeInfo,
        }),
      )

      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1?.typeInfo).toEqual(newTypeInfo)
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

      store = createStore(transactionReducer, initialState)
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

      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1?.typeInfo).toEqual(
        initialState[address]?.[UniverseChainId.Mainnet]?.tx1?.typeInfo,
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

      store = createStore(transactionReducer, initialState)
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

      store = createStore(transactionReducer, initialState)
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

      store = createStore(transactionReducer, initialState)
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

      store = createStore(transactionReducer, initialState)
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
      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.batch1).toBeUndefined()
    })

    it('should do nothing if batch transaction does not exist', () => {
      const initialState: TransactionsState = {
        [address]: {
          [UniverseChainId.Mainnet]: {
            tx1: baseApproveTx,
          },
        },
      }

      store = createStore(transactionReducer, initialState)
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

  describe('interfaceCancelTransactionWithHash', () => {
    it('should replace transaction with cancelled transaction using new hash', () => {
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

      store = createStore(transactionReducer, initialState)
      store.dispatch(
        interfaceCancelTransactionWithHash({
          chainId: UniverseChainId.Mainnet,
          id: 'tx1',
          address,
          cancelHash: '0xnew',
        }),
      )

      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.tx1).toBeUndefined()
      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['0xnew']).toBeDefined()
      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['0xnew']?.id).toBe('0xnew')
      expect(store.getState()[address]?.[UniverseChainId.Mainnet]?.['0xnew']?.hash).toBe('0xnew')

      // Check cancelled property if it exists (web transactions)
      const cancelledTx: InterfaceTransactionDetails | undefined = store.getState()[address]?.[
        UniverseChainId.Mainnet
      ]?.['0xnew'] as InterfaceTransactionDetails | undefined
      expect(cancelledTx?.cancelled).toBe(true)
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
      store = createStore(transactionReducer, initialState)

      try {
        store.dispatch(
          interfaceCancelTransactionWithHash({
            chainId: UniverseChainId.Mainnet,
            id: 'nonexistent',
            address,
            cancelHash: '0xnew',
          }),
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`interfaceCancelTransactionWithHash: Attempted to access a missing transaction with id nonexistent`),
        )
      }
      expect(store.getState()).toEqual(initialState)
    })
  })
})

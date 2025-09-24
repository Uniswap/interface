import { configureStore } from '@reduxjs/toolkit'
import { TradingApi } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import createSagaMiddleware from 'redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { transactionActions, transactionReducer } from 'uniswap/src/features/transactions/slice'
import {
  ClassicTransactionDetails,
  ExactInputSwapTransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { createTransactionRepositoryRedux } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepositoryImplRedux'
import { createSagaEffectRunner } from 'wallet/src/state/createSagaEffectRunner'

describe('TransactionRepositoryImplRedux', () => {
  // Create saga middleware for our tests
  const sagaMiddleware = createSagaMiddleware()

  // Create a real Redux store with saga middleware
  const store = configureStore({
    reducer: {
      transactions: transactionReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }).concat(sagaMiddleware),
  })

  // Create our own runSagaEffect function specific to this test
  const runSagaEffect = createSagaEffectRunner(sagaMiddleware)

  // Setup repository with real dependencies and our custom runSagaEffect
  const repositoryContext = {
    actions: transactionActions,
    makeSelectAddressTransactions,
    logger,
    runSagaEffect,
  }

  // Spy on the runSagaEffect function at the describe level
  const runSagaEffectSpy = jest.spyOn(repositoryContext, 'runSagaEffect')

  // Create repository
  const repository = createTransactionRepositoryRedux(repositoryContext)

  // Sample test data
  const mockAddress = '0x1234567890123456789012345678901234567890'
  const mockChainId = UniverseChainId.Mainnet
  const mockTransactionHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  const mockTransactionRequest = {
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    data: '0x',
    value: '0x0',
    chainId: mockChainId,
  } as providers.TransactionRequest

  const mockTransactionTypeInfo: ExactInputSwapTransactionInfo = {
    type: TransactionType.Swap,
    tradeType: 0, // TradeType.EXACT_INPUT
    inputCurrencyId: 'eth',
    outputCurrencyId: 'usdc',
    inputCurrencyAmountRaw: '1000000000000000000',
    expectedOutputCurrencyAmountRaw: '500000000',
    minimumOutputCurrencyAmountRaw: '490000000',
  }

  const mockTransaction: ClassicTransactionDetails = {
    chainId: mockChainId,
    id: '123',
    hash: mockTransactionHash, // Use the explicit hash string
    from: mockAddress,
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: mockTransactionTypeInfo,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    routing: TradingApi.Routing.CLASSIC,
    options: {
      request: mockTransactionRequest,
    },
  }

  beforeEach(() => {
    // Reset the store before each test
    store.dispatch({ type: 'transactions/resetTransactions' })
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe('addTransaction', () => {
    it('should add a transaction', async () => {
      await repository.addTransaction({ transaction: mockTransaction })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // Verify the transaction was added to the store through the saga middleware
      const state = store.getState()
      expect(state.transactions[mockAddress]?.[mockChainId]?.[mockTransaction.id]).toBeDefined()
    })
  })

  describe('updateTransaction', () => {
    it('should update a transaction', async () => {
      // First add a transaction
      store.dispatch(transactionActions.addTransaction(mockTransaction))

      // Update the transaction with new status
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.Success,
      }

      await repository.updateTransaction({ transaction: updatedTransaction })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // Check that the transaction was updated
      const state = store.getState()
      const storedTx = state.transactions[mockAddress]?.[mockChainId]?.[mockTransaction.id]
      expect(storedTx).toBeDefined()
      expect(storedTx?.status).toBe(TransactionStatus.Success)
    })
  })

  describe('updateTransaction with skipProcessing flag', () => {
    it('should update a transaction without watching when skipProcessing is true', async () => {
      // First add a transaction
      store.dispatch(transactionActions.addTransaction(mockTransaction))

      // Spy on the action creators to verify which one gets called
      const updateTransactionSpy = jest.spyOn(transactionActions, 'updateTransaction')
      const updateTransactionWithoutWatchSpy = jest.spyOn(transactionActions, 'updateTransactionWithoutWatch')

      // Update the transaction with new status
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.Success,
      }

      await repository.updateTransaction({ transaction: updatedTransaction, skipProcessing: true })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // Verify that updateTransactionWithoutWatch was called, not updateTransaction
      expect(updateTransactionWithoutWatchSpy).toHaveBeenCalledWith(updatedTransaction)
      expect(updateTransactionSpy).not.toHaveBeenCalled()

      // Check that the transaction was updated
      const state = store.getState()
      const storedTx = state.transactions[mockAddress]?.[mockChainId]?.[mockTransaction.id]
      expect(storedTx).toBeDefined()
      expect(storedTx?.status).toBe(TransactionStatus.Success)

      // Cleanup spies
      updateTransactionSpy.mockRestore()
      updateTransactionWithoutWatchSpy.mockRestore()
    })

    it.each([
      { skipProcessing: false, description: 'false' },
      { skipProcessing: undefined, description: 'undefined' },
    ])('should update a transaction with watching when skipProcessing is $description', async ({ skipProcessing }) => {
      // First add a transaction
      store.dispatch(transactionActions.addTransaction(mockTransaction))

      // Spy on the action creators to verify which one gets called
      const updateTransactionSpy = jest.spyOn(transactionActions, 'updateTransaction')
      const updateTransactionWithoutWatchSpy = jest.spyOn(transactionActions, 'updateTransactionWithoutWatch')

      // Update the transaction with new status
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.Success,
      }

      await repository.updateTransaction({ transaction: updatedTransaction, skipProcessing })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // Verify that updateTransaction was called, not updateTransactionWithoutWatch
      expect(updateTransactionSpy).toHaveBeenCalledWith(updatedTransaction)
      expect(updateTransactionWithoutWatchSpy).not.toHaveBeenCalled()

      // Check that the transaction was updated
      const state = store.getState()
      const storedTx = state.transactions[mockAddress]?.[mockChainId]?.[mockTransaction.id]
      expect(storedTx).toBeDefined()
      expect(storedTx?.status).toBe(TransactionStatus.Success)

      // Cleanup spies
      updateTransactionSpy.mockRestore()
      updateTransactionWithoutWatchSpy.mockRestore()
    })
  })

  describe('finalizeTransaction', () => {
    it('should finalize a transaction', async () => {
      // First add a transaction
      store.dispatch(transactionActions.addTransaction(mockTransaction))

      const status = TransactionStatus.Success

      await repository.finalizeTransaction({
        transaction: mockTransaction,
        status,
      })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // Check that the transaction was finalized
      const state = store.getState()
      const storedTx = state.transactions[mockAddress]?.[mockChainId]?.[mockTransaction.id]
      expect(storedTx).toBeDefined()
      expect(storedTx?.status).toBe(status)
    })
  })

  describe('getPendingPrivateTransactionCount', () => {
    it('should return the count of pending private transactions', async () => {
      // Create some test transactions with different statuses
      const pendingTx1: ClassicTransactionDetails = {
        ...mockTransaction,
        id: '1',
        status: TransactionStatus.Pending,
        options: {
          ...mockTransaction.options,
          submitViaPrivateRpc: true,
        },
      }

      const pendingTx2: ClassicTransactionDetails = {
        ...mockTransaction,
        id: '2',
        status: TransactionStatus.Pending,
        options: {
          ...mockTransaction.options,
          submitViaPrivateRpc: true,
        },
      }

      const successTx: ClassicTransactionDetails = {
        ...mockTransaction,
        id: '3',
        status: TransactionStatus.Success,
        options: {
          ...mockTransaction.options,
          submitViaPrivateRpc: true,
        },
      }

      // Add transactions to the store
      store.dispatch(transactionActions.addTransaction(pendingTx1))
      store.dispatch(transactionActions.addTransaction(pendingTx2))
      store.dispatch(transactionActions.addTransaction(successTx))

      // Call the repository method
      const count = await repository.getPendingPrivateTransactionCount({
        address: mockAddress,
        chainId: mockChainId,
      })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // We have 2 pending private transactions
      expect(count).toBe(2)
    })
  })

  describe('getTransactionsByAddress', () => {
    it('should return transactions for an address', async () => {
      // Add some test transactions
      const tx1: ClassicTransactionDetails = {
        ...mockTransaction,
        id: '1',
      }

      const tx2: ClassicTransactionDetails = {
        ...mockTransaction,
        id: '2',
      }

      store.dispatch(transactionActions.addTransaction(tx1))
      store.dispatch(transactionActions.addTransaction(tx2))

      // Call the repository method
      const transactions = await repository.getTransactionsByAddress({
        address: mockAddress,
      })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // We should get 2 transactions
      expect(transactions).toBeDefined()
      expect(transactions?.length).toBe(2)
      expect(transactions?.map((tx) => tx.id)).toContain('1')
      expect(transactions?.map((tx) => tx.id)).toContain('2')
    })

    it('should return undefined when no transactions exist', async () => {
      // Don't add any transactions for this address

      // Call the repository method
      const transactions = await repository.getTransactionsByAddress({
        address: '0xdifferentaddress',
      })

      // Verify that runSagaEffect was called
      expect(runSagaEffectSpy).toHaveBeenCalled()

      // We should get undefined
      expect(transactions).toBeUndefined()
    })
  })
})

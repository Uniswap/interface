import { createStore, Store } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'
import {
  addTransaction,
  cancelTransaction,
  finalizeTransaction,
  initialTransactionsState,
  replaceTransaction,
  resetTransactions,
  transactionReducer,
  TransactionStateMap,
  updateTransaction,
} from 'wallet/src/features/transactions/slice'
import {
  TransactionOptions,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'wallet/src/features/transactions/types'
import { finalizedTransactionAction } from 'wallet/src/test/fixtures'

const finalizedTxAction = finalizedTransactionAction()

const address = '0x123'

const approveTxTypeInfo: TransactionTypeInfo = {
  type: TransactionType.Approve,
  tokenAddress: '0xabc',
  spender: '0xdef',
}

const approveTxRequest: TransactionOptions = {
  request: {
    from: address,
    to: '0x456',
    value: '0x0',
  },
}

describe('transaction reducer', () => {
  let store: Store<TransactionStateMap>

  beforeEach(() => {
    store = createStore(transactionReducer, initialTransactionsState)
  })

  describe('addTransaction', () => {
    it('adds the transaction', () => {
      const beforeTime = new Date().getTime()
      store.dispatch(
        addTransaction({
          chainId: ChainId.Mainnet,
          id: '0',
          hash: '0x0',
          from: address,
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      const txs = store.getState()[address]
      expect(txs?.[ChainId.Mainnet]).toBeTruthy()
      expect(txs?.[ChainId.Mainnet]?.['0']).toBeTruthy()
      const tx = txs?.[ChainId.Mainnet]?.['0']
      expect(tx).toBeTruthy()
      expect(tx?.hash).toEqual('0x0')
      expect(tx?.from).toEqual(address)
      expect(tx?.addedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx?.typeInfo).toEqual({
        type: TransactionType.Approve,
        tokenAddress: '0xabc',
        spender: '0xdef',
      })
    })

    it('throws if attempting to add a transaction that already exists', () => {
      const id = '5'
      const chainId = ChainId.Mainnet
      store.dispatch(
        addTransaction({
          chainId,
          id,
          hash: '0x0',
          from: address,
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )

      try {
        store.dispatch(
          addTransaction({
            chainId,
            id,
            hash: '0x0',
            from: address,
            options: approveTxRequest,
            typeInfo: approveTxTypeInfo,
            status: TransactionStatus.Pending,
            addedTime: Date.now(),
          })
        )
      } catch (error) {
        expect(error).toEqual(Error(`addTransaction: Attempted to overwrite tx with id ${id}`))
      }
    })
  })

  describe('updateTransaction', () => {
    it('throws if attempting to update a missing transaction', () => {
      const id = '2'
      const chainId = ChainId.Polygon
      try {
        store.dispatch(
          updateTransaction({
            chainId,
            id,
            hash: '0x0',
            from: address,
            options: approveTxRequest,
            typeInfo: approveTxTypeInfo,
            status: TransactionStatus.Pending,
            addedTime: Date.now(),
          })
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`updateTransaction: Attempted to update a missing tx with id ${id}`)
        )
      }
      expect(store.getState()).toEqual({})
    })

    it('updates a transaction that was previoulsy added', () => {
      const id = '19'
      const chainId = ChainId.Polygon
      const transaction = {
        chainId,
        id,
        hash: '0x0',
        from: address,
        options: approveTxRequest,
        typeInfo: approveTxTypeInfo,
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
      }

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
            `finalizeTransaction: Attempted to finalize a missing tx with id ${finalizedTxAction.payload.id}`
          )
        )
      }
      expect(store.getState()).toEqual({})
    })

    const { from, chainId, id, receipt } = finalizedTxAction.payload
    it('finalizes a transaction that was previoulsy added', () => {
      store.dispatch(
        addTransaction({
          chainId,
          id,
          hash: '0x0',
          from,
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      store.dispatch(finalizeTransaction(finalizedTxAction.payload))
      const tx = store.getState()[from]?.[chainId]?.[id]
      expect(tx?.receipt).toEqual(receipt)
    })
  })

  describe('cancelTransaction', () => {
    it('throws if attempting to cancel a missing transaction', () => {
      const id = '13'
      try {
        store.dispatch(
          cancelTransaction({
            address: '0xaddress',
            chainId: ChainId.Goerli,
            cancelRequest: {},
            id,
          })
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`cancelTransaction: Attempted to cancel a tx that doesn't exist with id ${id}`)
        )
      }
      expect(store.getState()).toEqual({})
    })

    it('cancels a tranasction that was previoulsy added', () => {
      const id = '420'
      const chainId = ChainId.ArbitrumOne

      store.dispatch(
        addTransaction({
          chainId,
          id,
          hash: '0x0',
          from: address,
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
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
            chainId: ChainId.Goerli,
            id,
            newTxParams,
          })
        )
      } catch (error) {
        expect(error).toEqual(
          Error(`replaceTransaction: Attempted to replace a tx that doesn't exist with id ${id}`)
        )
      }
      expect(store.getState()).toEqual({})
    })

    it('replaces a tranasction that was previoulsy added', () => {
      const id = '101'
      const chainId = ChainId.Optimism
      const transaction = {
        chainId,
        id,
        hash: '0x0',
        from: address,
        options: approveTxRequest,
        typeInfo: approveTxTypeInfo,
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
      }

      store.dispatch(addTransaction(transaction))
      store.dispatch(replaceTransaction({ chainId, id, newTxParams, address }))
      const tx = store.getState()[address]?.[chainId]?.[id]
      expect(tx?.status).toEqual(TransactionStatus.Replacing)
    })
  })

  describe('clearAllTransactions', () => {
    it('removes all transactions for the chain', () => {
      const address1 = '0x123'
      const address2 = '0xabc'
      const chainId1 = ChainId.Mainnet
      const chainId2 = ChainId.Goerli
      store.dispatch(
        addTransaction({
          chainId: chainId1,
          id: '0',
          hash: '0x0',
          from: address1,
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      store.dispatch(
        addTransaction({
          chainId: chainId2,
          id: '1',
          hash: '0x1',
          from: address2,
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      const txs = store.getState()
      expect(Object.keys(txs)).toHaveLength(2)
      expect(Object.keys(txs)).toEqual([address1, address2])
      expect(Object.keys(txs[address1]?.[chainId1] ?? {})).toEqual(['0'])
      expect(Object.keys(txs[address2]?.[chainId2] ?? {})).toEqual(['1'])
      store.dispatch(resetTransactions())
      expect(Object.keys(store.getState())).toHaveLength(0)
    })
  })
})

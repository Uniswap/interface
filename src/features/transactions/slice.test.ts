import { createStore, Store } from '@reduxjs/toolkit'
import { ChainId } from 'src/constants/chains'
import {
  addTransaction,
  finalizeTransaction,
  initialState,
  replaceTransaction,
  resetTransactions,
  transactionReducer,
  TransactionState,
} from 'src/features/transactions/slice'
import {
  TransactionOptions,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'

const approveTxTypeInfo: TransactionTypeInfo = {
  type: TransactionType.APPROVE,
  tokenAddress: '0xabc',
  spender: '0xdef',
}

const approveTxRequest: TransactionOptions = {
  request: {
    from: '0x123',
    to: '0x456',
    value: '0x0',
  },
}

describe('transaction reducer', () => {
  let store: Store<TransactionState>

  beforeEach(() => {
    store = createStore(transactionReducer, initialState)
  })

  describe('addTransaction', () => {
    it('adds the transaction', () => {
      const beforeTime = new Date().getTime()
      store.dispatch(
        addTransaction({
          chainId: ChainId.MAINNET,
          id: '0',
          hash: '0x0',
          from: '0xabc',
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      const txs = store.getState().byChainId
      expect(txs[ChainId.MAINNET]).toBeTruthy()
      expect(txs[ChainId.MAINNET]?.['0']).toBeTruthy()
      const tx = txs[ChainId.MAINNET]?.['0']
      expect(tx).toBeTruthy()
      expect(tx?.hash).toEqual('0x0')
      expect(tx?.from).toEqual('0xabc')
      expect(tx?.addedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx?.typeInfo).toEqual({
        type: TransactionType.APPROVE,
        tokenAddress: '0xabc',
        spender: '0xdef',
      })
    })
  })

  describe('finalizeTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        finalizeTransaction({
          chainId: ChainId.RINKEBY,
          id: '0',
          status: TransactionStatus.Success,
          receipt: {
            transactionIndex: 1,
            blockHash: '0x0',
            blockNumber: 1,
            confirmations: 1,
            confirmedTime: 100,
          },
        })
      )
      expect(store.getState().byChainId).toEqual({})
    })
    it('sets receipt', () => {
      store.dispatch(
        addTransaction({
          chainId: ChainId.RINKEBY,
          id: '0',
          hash: '0x0',
          from: '0x0',
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      store.dispatch(
        finalizeTransaction({
          chainId: ChainId.RINKEBY,
          id: '0',
          status: TransactionStatus.Success,
          receipt: {
            transactionIndex: 1,
            blockHash: '0x0',
            blockNumber: 1,
            confirmations: 1,
            confirmedTime: 100,
          },
        })
      )
      const tx = store.getState().byChainId[4]?.['0']
      expect(tx?.receipt).toEqual({
        transactionIndex: 1,
        blockHash: '0x0',
        blockNumber: 1,
        confirmations: 1,
        confirmedTime: 100,
      })
    })
  })

  describe('replaceTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        replaceTransaction({
          chainId: ChainId.RINKEBY,
          id: '0',
          newTxParams: {
            gasPrice: '0x123',
          },
        })
      )
      expect(store.getState().byChainId).toEqual({})
    })
  })

  describe('clearAllTransactions', () => {
    it('removes all transactions for the chain', () => {
      store.dispatch(
        addTransaction({
          chainId: ChainId.MAINNET,
          id: '0',
          hash: '0x0',
          from: '0xabc',
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      store.dispatch(
        addTransaction({
          chainId: ChainId.RINKEBY,
          id: '1',
          hash: '0x1',
          from: '0xabc',
          options: approveTxRequest,
          typeInfo: approveTxTypeInfo,
          status: TransactionStatus.Pending,
          addedTime: Date.now(),
        })
      )
      const txs = store.getState().byChainId
      expect(Object.keys(txs)).toHaveLength(2)
      expect(Object.keys(txs)).toEqual([String(1), String(4)])
      expect(Object.keys(txs[1] ?? {})).toEqual(['0'])
      expect(Object.keys(txs[4] ?? {})).toEqual(['1'])
      store.dispatch(resetTransactions())
      expect(Object.keys(store.getState().byChainId)).toHaveLength(0)
    })
  })
})

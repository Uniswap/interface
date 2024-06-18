import { ChainId } from '@taraswap/sdk-core'
import { createStore, Store } from 'redux'

import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import reducer, {
  addTransaction,
  cancelTransaction,
  checkedTransaction,
  clearAllTransactions,
  finalizeTransaction,
  initialState,
  TransactionState,
} from './reducer'
import { ConfirmedTransactionDetails, PendingTransactionDetails, TransactionType } from './types'

describe('transaction reducer', () => {
  let store: Store<TransactionState>

  beforeEach(() => {
    store = createStore(reducer, initialState)
  })

  describe('addTransaction', () => {
    it('adds the transaction', () => {
      const beforeTime = new Date().getTime()
      store.dispatch(
        addTransaction({
          chainId: 1,
          hash: '0x0',
          from: 'abc',
          nonce: 1,
          info: {
            type: TransactionType.APPROVAL,
            tokenAddress: 'abc',
            spender: 'def',
            amount: '10000',
          },
        })
      )
      const txs = store.getState()
      expect(txs[1]).toBeTruthy()
      expect(txs[1]?.['0x0']).toBeTruthy()
      const tx = txs[1]?.['0x0']
      expect(tx).toBeTruthy()
      expect(tx.hash).toEqual('0x0')
      expect(tx.from).toEqual('abc')
      expect(tx.addedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx.info).toEqual({
        type: TransactionType.APPROVAL,
        tokenAddress: 'abc',
        spender: 'def',
        amount: '10000',
      })
    })
  })

  describe('finalizeTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        finalizeTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          status: TransactionStatus.Failed,
        })
      )
      expect(store.getState()).toEqual({})
    })
    it('sets receipt', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: ChainId.MAINNET,
          nonce: 2,
          info: {
            type: TransactionType.APPROVAL,
            spender: '0x0',
            tokenAddress: '0x0',
            amount: '10000',
          },
          from: '0x0',
        })
      )
      const beforeTime = new Date().getTime()
      store.dispatch(
        finalizeTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          status: TransactionStatus.Confirmed,
        })
      )
      const tx = store.getState()[ChainId.MAINNET]?.['0x0'] as ConfirmedTransactionDetails
      expect(tx.status).toBe(TransactionStatus.Confirmed)
      expect(tx.confirmedTime).toBeGreaterThanOrEqual(beforeTime)
    })
  })

  describe('checkedTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      expect(store.getState()).toEqual({})
    })
    it('sets lastCheckedBlockNumber', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: ChainId.MAINNET,
          nonce: 3,
          info: {
            type: TransactionType.APPROVAL,
            spender: '0x0',
            tokenAddress: '0x0',
            amount: '10000',
          },
          from: '0x0',
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      const tx = store.getState()[ChainId.MAINNET]?.['0x0'] as PendingTransactionDetails
      expect(tx.lastCheckedBlockNumber).toEqual(1)
    })
    it('never decreases', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: ChainId.MAINNET,
          nonce: 4,
          info: {
            type: TransactionType.APPROVAL,
            spender: '0x0',
            tokenAddress: '0x0',
            amount: '10000',
          },
          from: '0x0',
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          blockNumber: 3,
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      const tx = store.getState()[ChainId.MAINNET]?.['0x0'] as PendingTransactionDetails
      expect(tx.lastCheckedBlockNumber).toEqual(3)
    })
  })

  describe('clearAllTransactions', () => {
    it('removes all transactions for the chain', () => {
      store.dispatch(
        addTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          nonce: 5,
          info: {
            type: TransactionType.APPROVAL,
            spender: 'abc',
            tokenAddress: 'def',
            amount: '10000',
          },
          from: 'abc',
        })
      )
      store.dispatch(
        addTransaction({
          chainId: ChainId.OPTIMISM,
          nonce: 6,
          hash: '0x1',
          info: {
            type: TransactionType.APPROVAL,
            spender: 'abc',
            tokenAddress: 'def',
            amount: '10000',
          },
          from: 'abc',
        })
      )
      expect(Object.keys(store.getState())).toHaveLength(2)
      expect(Object.keys(store.getState())).toEqual([String(ChainId.MAINNET), String(ChainId.OPTIMISM)])
      expect(Object.keys(store.getState()[ChainId.MAINNET] ?? {})).toEqual(['0x0'])
      expect(Object.keys(store.getState()[ChainId.OPTIMISM] ?? {})).toEqual(['0x1'])
      store.dispatch(clearAllTransactions({ chainId: ChainId.MAINNET }))
      expect(Object.keys(store.getState())).toHaveLength(2)
      expect(Object.keys(store.getState())).toEqual([String(ChainId.MAINNET), String(ChainId.OPTIMISM)])
      expect(Object.keys(store.getState()[ChainId.MAINNET] ?? {})).toEqual([])
      expect(Object.keys(store.getState()[ChainId.OPTIMISM] ?? {})).toEqual(['0x1'])
    })
  })

  describe('cancelTransaction', () => {
    it('replaces original tx with a cancel tx', () => {
      store.dispatch(
        addTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          nonce: 7,
          info: {
            type: TransactionType.APPROVAL,
            spender: 'abc',
            tokenAddress: 'def',
            amount: '10000',
          },
          from: 'abc',
        })
      )
      const originalTx = store.getState()[ChainId.MAINNET]?.['0x0']
      store.dispatch(
        cancelTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          cancelHash: '0x1',
        })
      )
      expect(Object.keys(store.getState())).toHaveLength(1)
      expect(Object.keys(store.getState())).toEqual([String(ChainId.MAINNET)])
      expect(Object.keys(store.getState()[ChainId.MAINNET] ?? {})).toEqual(['0x1'])

      const cancelTx = store.getState()[ChainId.MAINNET]?.['0x1']

      expect(cancelTx).toEqual({ ...originalTx, hash: '0x1', cancelled: true })
    })
    it('does not error on cancelling a non-existant tx', () => {
      store.dispatch(
        cancelTransaction({
          chainId: ChainId.MAINNET,
          hash: '0x0',
          cancelHash: '0x1',
        })
      )
      expect(Object.keys(store.getState())).toHaveLength(0)
      expect(Object.keys(store.getState())).toEqual([])
    })
  })
})

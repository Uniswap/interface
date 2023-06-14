import { SupportedChainId } from 'constants/chains'
import { createStore, Store } from 'redux'

import { updateVersion } from '../global/actions'
import reducer, {
  addTransaction,
  checkedTransaction,
  clearAllTransactions,
  finalizeTransaction,
  initialState,
  TransactionState,
} from './reducer'
import { TransactionType } from './types'

describe('transaction reducer', () => {
  let store: Store<TransactionState>

  beforeEach(() => {
    store = createStore(reducer, initialState)
  })

  describe('updateVersion', () => {
    it('clears old format transactions that do not have info', () => {
      store = createStore(reducer, {
        1: {
          abc: {
            hash: 'abc',
          } as any,
        },
      })
      store.dispatch(updateVersion())
      expect(store.getState()[SupportedChainId.MAINNET]['abc']).toBeUndefined()
    })
    it('keeps old format transactions that do have info', () => {
      store = createStore(reducer, {
        1: {
          abc: {
            hash: 'abc',
            info: {},
          } as any,
        },
      })
      store.dispatch(updateVersion())
      expect(store.getState()[SupportedChainId.MAINNET]['abc']).toBeTruthy()
    })
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
      expect(tx?.hash).toEqual('0x0')
      expect(tx?.from).toEqual('abc')
      expect(tx?.addedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx?.info).toEqual({
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
          chainId: SupportedChainId.MAINNET,
          hash: '0x0',
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: '0x0',
            to: '0x0',
            from: '0x0',
            contractAddress: '0x0',
            blockHash: '0x0',
            blockNumber: 1,
          },
        })
      )
      expect(store.getState()).toEqual({})
    })
    it('sets receipt', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: SupportedChainId.MAINNET,
          nonce: 2,
          info: { type: TransactionType.APPROVAL, spender: '0x0', tokenAddress: '0x0', amount: '10000' },
          from: '0x0',
        })
      )
      const beforeTime = new Date().getTime()
      store.dispatch(
        finalizeTransaction({
          chainId: SupportedChainId.MAINNET,
          hash: '0x0',
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: '0x0',
            to: '0x0',
            from: '0x0',
            contractAddress: '0x0',
            blockHash: '0x0',
            blockNumber: 1,
          },
        })
      )
      const tx = store.getState()[SupportedChainId.MAINNET]?.['0x0']
      expect(tx?.confirmedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx?.receipt).toEqual({
        status: 1,
        transactionIndex: 1,
        transactionHash: '0x0',
        to: '0x0',
        from: '0x0',
        contractAddress: '0x0',
        blockHash: '0x0',
        blockNumber: 1,
      })
    })
  })

  describe('checkedTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        checkedTransaction({
          chainId: SupportedChainId.MAINNET,
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
          chainId: SupportedChainId.MAINNET,
          nonce: 3,
          info: { type: TransactionType.APPROVAL, spender: '0x0', tokenAddress: '0x0', amount: '10000' },
          from: '0x0',
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: SupportedChainId.MAINNET,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      const tx = store.getState()[SupportedChainId.MAINNET]?.['0x0']
      expect(tx?.lastCheckedBlockNumber).toEqual(1)
    })
    it('never decreases', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: SupportedChainId.MAINNET,
          nonce: 4,
          info: { type: TransactionType.APPROVAL, spender: '0x0', tokenAddress: '0x0', amount: '10000' },
          from: '0x0',
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: SupportedChainId.MAINNET,
          hash: '0x0',
          blockNumber: 3,
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: SupportedChainId.MAINNET,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      const tx = store.getState()[SupportedChainId.MAINNET]?.['0x0']
      expect(tx?.lastCheckedBlockNumber).toEqual(3)
    })
  })

  describe('clearAllTransactions', () => {
    it('removes all transactions for the chain', () => {
      store.dispatch(
        addTransaction({
          chainId: SupportedChainId.MAINNET,
          hash: '0x0',
          nonce: 5,
          info: { type: TransactionType.APPROVAL, spender: 'abc', tokenAddress: 'def', amount: '10000' },
          from: 'abc',
        })
      )
      store.dispatch(
        addTransaction({
          chainId: SupportedChainId.OPTIMISM,
          nonce: 6,
          hash: '0x1',
          info: { type: TransactionType.APPROVAL, spender: 'abc', tokenAddress: 'def', amount: '10000' },
          from: 'abc',
        })
      )
      expect(Object.keys(store.getState())).toHaveLength(2)
      expect(Object.keys(store.getState())).toEqual([
        String(SupportedChainId.MAINNET),
        String(SupportedChainId.OPTIMISM),
      ])
      expect(Object.keys(store.getState()[SupportedChainId.MAINNET] ?? {})).toEqual(['0x0'])
      expect(Object.keys(store.getState()[SupportedChainId.OPTIMISM] ?? {})).toEqual(['0x1'])
      store.dispatch(clearAllTransactions({ chainId: SupportedChainId.MAINNET }))
      expect(Object.keys(store.getState())).toHaveLength(2)
      expect(Object.keys(store.getState())).toEqual([
        String(SupportedChainId.MAINNET),
        String(SupportedChainId.OPTIMISM),
      ])
      expect(Object.keys(store.getState()[SupportedChainId.MAINNET] ?? {})).toEqual([])
      expect(Object.keys(store.getState()[SupportedChainId.OPTIMISM] ?? {})).toEqual(['0x1'])
    })
  })
})

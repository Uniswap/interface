import { ChainId } from '@uniswap/sdk'
import { createStore, Store } from 'redux'
// import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction } from './actions'
// import reducer, { initialState } } from './reducer'

// describe('transaction reducer', () => {
//   let store: Store<TransactionState>

//   beforeEach(() => {
//     store = createStore(reducer, initialState)
//   })

//   describe('newEstimate', () => {
//     it('pop up box', () => {
//       const beforeTime = new Date().getTime()
//       store.dispatch(
//         addTransaction({
//           chainId: ChainId.MAINNET,
//           summary: 'hello world',
//           hash: '0x0',
//           approval: { tokenAddress: 'abc', spender: 'def' },
//           from: 'abc',
//         })
//       )
//       const txs = store.getState()
//       expect(txs[ChainId.MAINNET]).toBeTruthy()
//       expect(txs[ChainId.MAINNET]?.['0x0']).toBeTruthy()
//       const tx = txs[ChainId.MAINNET]?.['0x0']
//       expect(tx).toBeTruthy()
//       expect(tx?.hash).toEqual('0x0')
//       expect(tx?.summary).toEqual('hello world')
//       expect(tx?.approval).toEqual({ tokenAddress: 'abc', spender: 'def' })
//       expect(tx?.from).toEqual('abc')
//       expect(tx?.addedTime).toBeGreaterThanOrEqual(beforeTime)
//     })
//   })
// })

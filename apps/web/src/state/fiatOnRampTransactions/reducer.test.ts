import { createStore, Store } from 'redux'
import reducer, {
  addFiatOnRampTransaction,
  FiatOnRampTransactionDetails,
  FiatOnRampTransactionsState,
  initialState,
  removeFiatOnRampTransaction,
  updateFiatOnRampTransaction,
} from 'state/fiatOnRampTransactions/reducer'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'

const account = '0xabc'

const transaction: FiatOnRampTransactionDetails = {
  externalSessionId: '0x0',
  account,
  status: FiatOnRampTransactionStatus.INITIATED,
  forceFetched: false,
  addedAt: 1001,
  type: FiatOnRampTransactionType.BUY,
  syncedWithBackend: false,
  provider: 'COINBASE_PAY',
}

describe('fiatOnRampTransactions reducer', () => {
  let store: Store<FiatOnRampTransactionsState>

  beforeEach(() => {
    store = createStore(reducer, initialState)
  })

  describe('addFiatOnRampTransaction', () => {
    it('adds the transaction', () => {
      store.dispatch(addFiatOnRampTransaction(transaction))

      const txs = store.getState()

      expect(txs).toStrictEqual({
        [account]: {
          [transaction.externalSessionId]: transaction,
        },
      })

      // Adding a signature w/ same id should be a no-op
      store.dispatch(addFiatOnRampTransaction(transaction))
      expect(store.getState()).toStrictEqual({
        [account]: {
          [transaction.externalSessionId]: transaction,
        },
      })
    })
  })

  describe('updateFiatOnRampTransaction', () => {
    it('updates the transaction', () => {
      store.dispatch(addFiatOnRampTransaction(transaction))
      const updatedTransaction = { ...transaction, status: FiatOnRampTransactionStatus.PENDING } as const
      store.dispatch(updateFiatOnRampTransaction(updatedTransaction))

      const txs = store.getState()

      expect(txs).toStrictEqual({
        [account]: {
          [transaction.externalSessionId]: updatedTransaction,
        },
      })

      expect(() =>
        store.dispatch(updateFiatOnRampTransaction({ ...transaction, externalSessionId: 'non existent id' })),
      ).toThrow()
    })
  })

  describe('removeFiatOnRampTransaction', () => {
    it('removes the transaction', () => {
      store.dispatch(addFiatOnRampTransaction(transaction))
      store.dispatch(removeFiatOnRampTransaction(transaction))

      const txs = store.getState()

      expect(txs).toStrictEqual({
        [account]: {},
      })
    })
  })
})

import { Store } from '@reduxjs/toolkit'
import { persistStore } from 'redux-persist'
import { createDefaultStore } from 'state'
import { initialState as initialListsState } from 'state/lists/reducer'
import { PERSIST_VERSION } from 'state/migrations'
import { RouterPreference } from 'state/routing/types'
import { initialState as initialUserState } from 'state/user/reducer'
import { initialTransactionsState } from 'uniswap/src/features/transactions/slice'

const defaultState = {
  lists: {},
  transactions: {},
  user: {},
  _persist: {
    rehydrated: true,
    version: PERSIST_VERSION,
  },
  application: {
    chainId: null,
    openModal: null,
  },
  logs: {},
  mint: {
    independentField: 'CURRENCY_A',
    leftRangeTypedValue: '',
    otherTypedValue: '',
    rightRangeTypedValue: '',
    startPriceTypedValue: '',
    typedValue: '',
  },
  mintV3: {
    independentField: 'CURRENCY_A',
    leftRangeTypedValue: '',
    rightRangeTypedValue: '',
    startPriceTypedValue: '',
    typedValue: '',
  },
  searchHistory: {
    results: [],
  },
  userSettings: {
    currentLanguage: 'en',
    currentCurrency: 'USD',
    hideSmallBalances: true,
    hideSpamTokens: true,
  },
}

describe('redux migrations', () => {
  let store: Store

  beforeEach(() => {
    localStorage.clear()
    // Re-create the store before each test so it starts with undefined state.
    store = createDefaultStore()
  })

  it('clears legacy redux_localstorage_simple values during the initial migration', async () => {
    localStorage.setItem(
      'redux_localstorage_simple_transactions',
      JSON.stringify({ 1: { test: { info: 'transactions' } } }),
    )
    localStorage.setItem(
      'redux_localstorage_simple_user',
      JSON.stringify({ test: 'user', userRouterPreference: 'auto' }),
    )
    localStorage.setItem('redux_localstorage_simple_lists', JSON.stringify({ test: 'lists' }))
    localStorage.setItem('redux_localstorage_simple_signatures', JSON.stringify({ test: 'signatures' }))

    persistStore(store)
    // wait for the migration to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(localStorage.getItem('redux_localstorage_simple_transactions')).toBeNull()
    expect(localStorage.getItem('redux_localstorage_simple_user')).toBeNull()
    expect(localStorage.getItem('redux_localstorage_simple_lists')).toBeNull()

    const state = store.getState()
    expect(state).toMatchObject({
      ...defaultState,
      // These are migrated values.
      lists: {
        byUrl: undefined,
      },
      user: {
        test: 'user',
        userRouterPreference: RouterPreference.X,
      },
    })
  })

  it('clears localWebTransactions during migration', async () => {
    // Set up legacy state with localWebTransactions
    localStorage.setItem(
      'persist:interface',
      JSON.stringify({
        user: { ...initialUserState, test: 'user' },
        localWebTransactions: { test: 'localWebTransactions' },
        transactions: initialTransactionsState,
        lists: initialListsState,
        _persist: { version: -1 },
      }),
    )

    persistStore(store)
    // wait for the migration to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    const state = store.getState()
    expect(state).toMatchObject(defaultState)
    // Verify localWebTransactions is not present in the final state
    expect(state.localWebTransactions).toBeUndefined()
  })

  it('initial state with no previous persisted state', async () => {
    persistStore(store)
    // wait for the migration to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    const state = store.getState()
    expect(state).toMatchObject(defaultState)
  })

  it('migrates from a previous version of the state type', async () => {
    localStorage.setItem(
      'persist:interface',
      JSON.stringify({
        user: { ...initialUserState, test: 'user' },
        transactions: initialTransactionsState,
        lists: initialListsState,
        _persist: { version: -1 },
      }),
    )

    persistStore(store)
    // wait for the migration to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    const state = store.getState()
    expect(state).toMatchObject(defaultState)
  })
})

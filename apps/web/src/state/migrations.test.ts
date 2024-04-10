import { Store } from '@reduxjs/toolkit'
import { persistStore } from 'redux-persist'
import { createDefaultStore } from 'state'

import { initialState as initialListsState } from './lists/reducer'
import { RouterPreference } from './routing/types'
import { initialState as initialSignaturesState } from './signatures/reducer'
import { initialState as initialTransactionsState } from './transactions/reducer'
import { initialState as initialUserState } from './user/reducer'

const defaultState = {
  lists: {},
  transactions: {},
  user: {},
  _persist: {
    rehydrated: true,
    version: 7,
  },
  application: {
    chainId: null,
    fiatOnramp: {
      availabilityChecked: false,
      available: false,
    },
    openModal: null,
    popupList: [],
  },
  burn: {
    independentField: 'LIQUIDITY_PERCENT',
    typedValue: '0',
  },
  burnV3: {
    percent: 0,
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
  multicall: {
    callResults: {},
  },
  wallets: {
    connectedWallets: [],
    switchingChain: false,
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
      JSON.stringify({ 1: { test: { info: 'transactions' } } })
    )
    localStorage.setItem(
      'redux_localstorage_simple_user',
      JSON.stringify({ test: 'user', userRouterPreference: 'auto' })
    )
    localStorage.setItem('redux_localstorage_simple_lists', JSON.stringify({ test: 'lists' }))
    localStorage.setItem('redux_localstorage_simple_signatures', JSON.stringify({ test: 'signatures' }))

    persistStore(store)
    // wait for the migration to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(localStorage.getItem('redux_localstorage_simple_transactions')).toBeNull()
    expect(localStorage.getItem('redux_localstorage_simple_user')).toBeNull()
    expect(localStorage.getItem('redux_localstorage_simple_lists')).toBeNull()
    expect(localStorage.getItem('redux_localstorage_simple_signatures')).toBeNull()

    const state = store.getState()
    expect(state).toMatchObject({
      ...defaultState,
      // These are migrated values.
      lists: {
        test: 'lists',
      },
      transactions: {
        1: {
          test: { info: 'transactions' },
        },
      },
      user: {
        test: 'user',
        userRouterPreference: RouterPreference.X,
      },
      signatures: {
        test: 'signatures',
      },
    })
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
        signatures: initialSignaturesState,
        _persist: { version: -1 },
      })
    )

    persistStore(store)
    // wait for the migration to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    const state = store.getState()
    expect(state).toMatchObject(defaultState)
  })
})

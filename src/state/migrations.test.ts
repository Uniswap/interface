import { persistStore } from 'redux-persist'

import store from './index'

describe('redux migrations', () => {
  it('clears legacy redux_localstorage_simple values during the initial migration', async () => {
    localStorage.setItem('redux_localstorage_simple_transactions', JSON.stringify({ test: 'transactions' }))
    localStorage.setItem('redux_localstorage_simple_user', JSON.stringify({ test: 'user' }))
    localStorage.setItem('redux_localstorage_simple_lists', JSON.stringify({ test: 'lists' }))

    persistStore(store)
    // wait for the migration to complete
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(localStorage.getItem('redux_localstorage_simple_transactions')).toBeNull()
    expect(localStorage.getItem('redux_localstorage_simple_user')).toBeNull()
    expect(localStorage.getItem('redux_localstorage_simple_lists')).toBeNull()

    const state = store.getState()
    expect(state).toMatchObject(JSON.parse(localStorage.getItem('root') ?? '{}'))
    expect(state).toMatchObject({
      // These are migrated values.
      lists: {
        test: 'lists',
      },
      transactions: {
        test: 'transactions',
      },
      user: {
        test: 'user',
      },
      _persist: {
        rehydrated: true,
        version: 0,
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
      routingApi: {
        config: {
          focused: true,
          keepUnusedDataFor: 60,
          middlewareRegistered: true,
          online: true,
          reducerPath: 'routingApi',
          refetchOnFocus: false,
          refetchOnMountOrArgChange: false,
          refetchOnReconnect: false,
        },
        mutations: {},
        provided: {},
        queries: {},
        subscriptions: {},
      },
      routingApiV2: {
        config: {
          focused: true,
          keepUnusedDataFor: 60,
          middlewareRegistered: true,
          online: true,
          reducerPath: 'routingApiV2',
          refetchOnFocus: false,
          refetchOnMountOrArgChange: false,
          refetchOnReconnect: false,
        },
        mutations: {},
        provided: {},
        queries: {},
        subscriptions: {},
      },
      wallets: {
        connectedWallets: [],
        switchingChain: false,
      },
    })
  })
})

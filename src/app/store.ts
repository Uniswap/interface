import AsyncStorage from '@react-native-async-storage/async-storage'
import { configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { dataApi } from 'src/features/dataApi/slice'
import { nftApi } from 'src/features/nfts/api'
import { routingApi } from 'src/features/routing/routingApi'
import { swapActions } from 'src/features/transactions/swap/swapSaga'
import { tokenWrapActions } from 'src/features/transactions/swap/wrapSaga'

const sagaMiddleware = createSagaMiddleware({
  context: {
    signers: walletContextValue.signers,
    providers: walletContextValue.providers,
    contracts: walletContextValue.contracts,
  },
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: [
    'wallet',
    'balances',
    'chains',
    'transactions',
    'tokenLists',
    'tokens',
    'walletConnect',
  ],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    const middleware = [
      ...getDefaultMiddleware({
        thunk: true, // required for rtk-query
        serializableCheck: {
          ignoredActions: [
            FLUSH,
            REHYDRATE,
            PAUSE,
            PERSIST,
            PURGE,
            REGISTER,
            // contains non-serializable objects that do not hit the store
            swapActions.trigger.type,
            tokenWrapActions.trigger.type,
          ],
          warnAfter: 128,
        },
        invariantCheck: {
          warnAfter: 256,
        },
        immutableCheck: {
          warnAfter: 256,
        },
      }),
      sagaMiddleware,
      dataApi.middleware,
      nftApi.middleware,
      routingApi.middleware,
    ]

    return middleware
  },
  devTools: config.debug,
})

export const persistor = persistStore(store)
sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch

import createSagaMiddleware from 'redux-saga'
import type { Middleware, PreloadedState } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { loggerMiddleware } from '../features/logger/middleware'
import { walletContextValue } from '../features/wallet/context'
import { reducer } from './reducer'
import { rootSaga } from './saga'

export const createStore = ({
  afterMiddleware = [],
  beforeMiddleware = [],
  preloadedState = {},
}: {
  afterMiddleware?: Array<Middleware<unknown>>
  beforeMiddleware?: Array<Middleware<unknown>>
  preloadedState?: PreloadedState<RootState>
}) => {
  const sagaMiddleware = createSagaMiddleware({
    context: {
      signers: walletContextValue.signers,
      providers: walletContextValue.providers,
      contracts: walletContextValue.contracts,
    },
  })

  const store = configureStore({
    reducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(beforeMiddleware)
        .concat(loggerMiddleware, sagaMiddleware)
        .concat(afterMiddleware),
  })

  // Subscribes to redux store changes. For each, store new state in storage.
  // Required to make `webext-redux` work with Manifest V3 given bg script
  // runs in transient service workers.
  store.subscribe(() => {
    chrome.storage.local.set({ state: store.getState() })
  })

  sagaMiddleware.run(rootSaga)

  return store
}

export type RootState = ReturnType<typeof reducer>
export type AppDispatch = ReturnType<typeof createStore>['dispatch']
export type AppSelector<T> = (state: RootState) => T

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

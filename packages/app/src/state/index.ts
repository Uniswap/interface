import createSagaMiddleware from 'redux-saga'
import type { Middleware, PreloadedState } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { loggerMiddleware } from '../features/logger/middleware'
import { walletContextValue } from '../features/wallet/context'
import { rootReducer, persistStore } from './reducer'
import { rootSaga } from './saga'

export const createStore = ({
  afterMiddleware = [],
  beforeMiddleware = [],
  hydrationCallback,
  preloadedState = {},
}: {
  afterMiddleware?: Array<Middleware<unknown>>
  beforeMiddleware?: Array<Middleware<unknown>>
  preloadedState?: PreloadedState<RootState>
  // invoked after store is rehydrated
  hydrationCallback?: () => void
}) => {
  const sagaMiddleware = createSagaMiddleware({
    context: {
      signers: walletContextValue.signers,
      providers: walletContextValue.providers,
      contracts: walletContextValue.contracts,
    },
  })

  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(beforeMiddleware)
        .concat(loggerMiddleware, sagaMiddleware)
        .concat(afterMiddleware),
  })

  persistStore(store, null, hydrationCallback)

  sagaMiddleware.run(rootSaga)

  return store
}

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = ReturnType<typeof createStore>['dispatch']
export type AppSelector<T> = (state: RootState) => T

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

import type { Middleware, PreloadedState, Reducer } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import createSagaMiddleware, { Saga } from 'redux-saga'
import { SelectEffect } from 'redux-saga/effects'
import { SagaGenerator, select } from 'typed-redux-saga'
import { loggerMiddleware } from 'wallet/src/features/logger/middleware'
import { walletContextValue } from 'wallet/src/features/wallet/context'
import { WalletState } from 'wallet/src/features/wallet/slice'
import { SagaState } from 'wallet/src/utils/saga'
import { sharedRootReducer } from './reducer'
import { rootSaga } from './saga'

interface CreateStoreProps {
  reducer: Reducer
  // sagas to load in addition to the shared ones
  // can be used for app-specific sagas
  additionalSagas?: Array<Saga<unknown[]>>
  // middlewares to add after the default middleware
  // recommended over `middlewareBefore`
  middlewareAfter?: Array<Middleware<unknown>>
  // middlewares to before after the default middleware
  middlewareBefore?: Array<Middleware<unknown>>
  preloadedState?: PreloadedState<RootState>
}

export function createStore({
  additionalSagas = [],
  middlewareAfter = [],
  middlewareBefore = [],
  preloadedState = {},
  reducer,
}: CreateStoreProps): ReturnType<typeof configureStore> {
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
      getDefaultMiddleware({
        // required for rtk-query
        thunk: true,
        // turn off since it slows down for dev and also doesn't run in prod
        // TODO: [MOB-641] figure out why this is slow
        serializableCheck: false,
        invariantCheck: {
          warnAfter: 256,
        },
        // slows down dev build considerably
        immutableCheck: false,
      })
        .prepend(middlewareBefore)
        .concat(loggerMiddleware, sagaMiddleware)
        .concat(middlewareAfter),
    devTools: __DEV__,
  })

  sagaMiddleware.run(rootSaga)
  additionalSagas.forEach((saga) => sagaMiddleware.run(saga))

  return store
}

// Utility types and functions to be used inside the wallet shared package
// Apps should re-define those with a more specific `AppState`
export type RootState = ReturnType<typeof sharedRootReducer> & {
  saga: Record<string, SagaState>
  wallet: WalletState // TODO: share this between mobile and web
}
export type AppDispatch = ReturnType<typeof createStore>['dispatch']
export type AppSelector<T> = (state: RootState) => T

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: RootState) => T): SagaGenerator<T, SelectEffect> {
  const state = yield* select(fn)
  return state
}

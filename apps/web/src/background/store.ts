import { useCallback } from 'react'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { AnyAction, combineReducers } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { dappReducer } from 'src/background/features/dapp/slice'
import { dappRequestReducer } from 'src/background/features/dappRequests/slice'
import { loggerMiddleware } from 'src/background/utils/loggerMiddleware'
import { PortName } from 'src/types'
import { SagaGenerator, select } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { createStore, RootState } from 'wallet/src/state'
import { sharedReducers } from 'wallet/src/state/reducer'
import { Store, wrapStore } from 'webext-redux'
import { persistConfig } from './reducer'
import { monitoredSagaReducers, webRootSaga } from './saga'

export const webReducers = {
  ...sharedReducers,
  saga: monitoredSagaReducers,
  dapp: dappReducer,
  dappRequests: dappRequestReducer,
} as const

const webReducer = persistReducer(persistConfig, combineReducers(webReducers))

export function initializeStore(
  portName: PortName = PortName.Store
): Promise<ReturnType<typeof createStore>> {
  return new Promise((resolve) => {
    const store = createStore({
      reducer: webReducer,
      additionalSagas: [webRootSaga],
      middlewareBefore: [loggerMiddleware],
    })

    // https://github.com/tshaddix/webext-redux/issues/286#issuecomment-1347985776
    Object.assign(store, {
      dispatch: store.dispatch.bind(store),
      getState: store.getState.bind(store),
      subscribe: store.subscribe.bind(store),
    })

    persistStore(store, null, () => resolve(store))

    // proxy store with webext-redux to simplify cross-thread communication
    wrapStore(store, { portName })
  })
}

// TODO: set up lint rule to prevent imports from packages/wallet
export type WebState = ReturnType<typeof webReducer> & RootState
export type ReducerNames = keyof typeof webReducers
export type AppDispatch = Store<AnyAction>['dispatch']
export type AppSelector<T> = (state: WebState) => T

export const useAppDispatch = (): ((action: AnyAction) => Promise<AnyAction | undefined>) => {
  const appDispatch = useDispatch()

  // We need `useCallback` here to make sure we don't trigger unnecessary re-renders by returning a new `dispatch` object every time.
  const wrappedAppDispatch = useCallback(
    (action: AnyAction): Promise<AnyAction | undefined> => {
      try {
        // webext-redux wraps dispatch in a promise
        return Promise.resolve(appDispatch(action))
      } catch (error) {
        logger.error(error, { tags: { file: 'store', function: 'appDispatch' } })

        return Promise.resolve(undefined)
      }
    },
    [appDispatch]
  )

  return wrappedAppDispatch
}

export const useAppSelector: TypedUseSelectorHook<WebState> = useSelector

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: WebState) => T): SagaGenerator<T> {
  const state = yield* select(fn)
  return state
}

import type { Middleware, PreloadedState, Reducer, StoreEnhancer } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware, { Saga, SagaIterator, SagaMiddleware } from 'redux-saga'
import { walletContextValue } from 'wallet/src/features/wallet/context'
import { createSagaEffectRunner } from 'wallet/src/state/createSagaEffectRunner'
import { rootWalletSaga } from 'wallet/src/state/saga'
import { WalletStateReducersOnly } from 'wallet/src/state/walletReducer'

interface CreateStoreProps {
  reducer: Reducer
  // sagas to load in addition to the shared ones
  // can be used for app-specific sagas
  additionalSagas?: Array<Saga<unknown[]>>
  enhancers?: Array<StoreEnhancer>
  // middlewares to add after the default middleware
  // recommended over `middlewareBefore`
  middlewareAfter?: Array<Middleware<unknown>>
  // middlewares to before after the default middleware
  middlewareBefore?: Array<Middleware<unknown>>
  preloadedState?: PreloadedState<WalletStateReducersOnly>
}

// Module-level container for saga middleware instance
// Only initialized inside createStore to avoid timing issues
const sagaContainer: {
  middleware?: SagaMiddleware
} = {}

/**
 * Get saga middleware instance, throws if not initialized
 */
export function getSagaMiddleware(): SagaMiddleware {
  if (!sagaContainer.middleware) {
    throw new Error('Saga middleware not initialized. Must call createStore first.')
  }
  return sagaContainer.middleware
}

/**
 * Get a saga effect runner using the initialized middleware
 * This will throw if called before createStore
 */
export const runSagaEffect = <T>(effect: SagaIterator<T>): Promise<T> => {
  return createSagaEffectRunner(getSagaMiddleware())(effect)
}

// Disable eslint rule to infer return type from the returned value
// (it is complex and not worth the effort to type it manually)
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createStore({
  additionalSagas = [],
  middlewareAfter = [],
  middlewareBefore = [],
  preloadedState = {},
  enhancers = [],
  reducer,
}: CreateStoreProps) {
  const sagaMiddleware = createSagaMiddleware({
    context: {
      signers: walletContextValue.signers,
      providers: walletContextValue.providers,
      contracts: walletContextValue.contracts,
    },
  })

  // Store the middleware in the module-level container
  // so we can use it in the saga effect runner
  sagaContainer.middleware = sagaMiddleware

  const store = configureStore({
    reducer,
    preloadedState,
    enhancers,
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
        .concat(sagaMiddleware)
        .concat(middlewareAfter),
    devTools: __DEV__,
  })

  sagaMiddleware.run(rootWalletSaga)
  additionalSagas.forEach((saga) => sagaMiddleware.run(saga))

  return store
}

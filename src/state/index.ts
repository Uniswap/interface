import { configureStore, Reducer } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import * as Sentry from '@sentry/react'
import multicall from 'lib/state/multicall'
import { load, save } from 'redux-localstorage-simple'
import { isTestEnv } from 'utils/env'

import application from './application/reducer'
import burn from './burn/reducer'
import burnV3 from './burn/v3/reducer'
import connection from './connection/reducer'
import { updateVersion } from './global/actions'
import lists from './lists/reducer'
import logs from './logs/slice'
import mint from './mint/reducer'
import mintV3 from './mint/v3/reducer'
import { routingApi } from './routing/slice'
import swap from './swap/reducer'
import transactions from './transactions/reducer'
import user from './user/reducer'
import wallets from './wallets/reducer'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists']

const reducer = {
  application,
  user,
  connection,
  transactions,
  wallets,
  swap,
  mint,
  mintV3,
  burn,
  burnV3,
  multicall: multicall.reducer,
  lists,
  logs,
  [routingApi.reducerPath]: routingApi.reducer,
}

/* Utility type to extract state type out of a @reduxjs/toolkit Reducer type */
type GetState<T> = T extends Reducer<infer State> ? State : never

/* Utility type to mark all properties of a type as optional */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/* eslint-disable-next-line import/no-unused-modules -- reports false positive error, we use that type in other modules */
export type AppState = {
  [K in keyof typeof reducer]: GetState<typeof reducer[K]>
}

/* eslint-disable-next-line import/no-unused-modules -- reports false positive error, we use that type in other modules */
export type AppDispatch = typeof store.dispatch

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true })
      .concat(routingApi.middleware)
      .concat(save({ states: PERSISTED_KEYS, debounce: 1000 }))
      .concat(
        Sentry.createReduxEnhancer({
          actionTransformer: () => null,
          /**
           * This function runs on every state update, so keeping it as fast as possible by avoiding any function
           * calls and deep object traversals.
           */
          stateTransformer: (state: AppState): DeepPartial<AppState> => {
            return {
              application: {
                fiatOnramp: state.application.fiatOnramp,
                chainId: state.application.chainId,
                openModal: state.application.openModal,
                popupList: state.application.popupList,
              },
              user: {
                fiatOnrampAcknowledgments: state.user.fiatOnrampAcknowledgments,
                selectedWallet: state.user.selectedWallet,
                lastUpdateVersionTimestamp: state.user.lastUpdateVersionTimestamp,
                matchesDarkMode: state.user.matchesDarkMode,
                userDarkMode: state.user.userDarkMode,
                userLocale: state.user.userLocale,
                userExpertMode: state.user.userExpertMode,
                userClientSideRouter: state.user.userClientSideRouter,
                userHideClosedPositions: state.user.userHideClosedPositions,
                userSlippageTolerance: state.user.userSlippageTolerance,
                userSlippageToleranceHasBeenMigratedToAuto: state.user.userSlippageToleranceHasBeenMigratedToAuto,
                userDeadline: state.user.userDeadline,
                timestamp: state.user.timestamp,
                URLWarningVisible: state.user.URLWarningVisible,
                showSurveyPopup: state.user.showSurveyPopup,
              },
              connection: {
                errorByConnectionType: state.connection.errorByConnectionType,
              },
              transactions: state.transactions,
            }
          },
        })
      ),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: isTestEnv() }),
})

store.dispatch(updateVersion())

setupListeners(store.dispatch)

export default store

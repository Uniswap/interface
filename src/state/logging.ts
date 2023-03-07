import * as Sentry from '@sentry/react'

import { AppState } from './types'

/* Utility type to mark all properties of a type as optional */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/**
 * This enhancer will automatically store the latest state in Sentry's scope, so that it will be available
 * in the Sentry dashboard when an exception happens.
 */
export const sentryEnhancer = Sentry.createReduxEnhancer({
  /**
   * We don't want to store actions as breadcrumbs in Sentry, so we return null to disable the default behavior.
   */
  actionTransformer: () => null,
  /**
   * We only want to store a subset of the state in Sentry, containing only the relevant parts for debugging.
   * Note: This function runs on every state update, so we're keeping it as fast as possible by avoiding any function
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

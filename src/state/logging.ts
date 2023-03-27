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
    const { application, user, connection, transactions } = state
    return {
      application: {
        fiatOnramp: application.fiatOnramp,
        chainId: application.chainId,
        openModal: application.openModal,
        popupList: application.popupList,
      },
      user: {
        selectedWallet: user.selectedWallet,
        lastUpdateVersionTimestamp: user.lastUpdateVersionTimestamp,
        userLocale: user.userLocale,
        userExpertMode: user.userExpertMode,
        userClientSideRouter: user.userClientSideRouter,
        userHideClosedPositions: user.userHideClosedPositions,
        userSlippageTolerance: user.userSlippageTolerance,
        userSlippageToleranceHasBeenMigratedToAuto: user.userSlippageToleranceHasBeenMigratedToAuto,
        userDeadline: user.userDeadline,
        timestamp: user.timestamp,
        URLWarningVisible: user.URLWarningVisible,
        showSurveyPopup: user.showSurveyPopup,
      },
      connection: {
        errorByConnectionType: connection.errorByConnectionType,
      },
      transactions,
    }
  },
})

import { StackActions } from '@react-navigation/core'
import { i18n } from 'src/app/i18n'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { Screens } from 'src/screens/Screens'
import { call, put, takeEvery } from 'typed-redux-saga'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { restorePrivateKeyComplete } from 'wallet/src/features/wallet/slice'

/**
 * Watch when we've restored a private key (new phone migration)
 */
export function* restorePrivateKeyCompleteWatcher() {
  yield* takeEvery(restorePrivateKeyComplete, onRestorePrivateKeyComplete)
}

function* onRestorePrivateKeyComplete() {
  yield* put(
    pushNotification({
      type: AppNotificationType.Success,
      title: i18n.t('Wallet restored!'),
    })
  )
  yield* call(dispatchNavigationAction, StackActions.replace(Screens.Home))
}

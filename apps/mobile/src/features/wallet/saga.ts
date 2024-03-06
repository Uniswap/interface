import { StackActions } from '@react-navigation/core'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { Screens } from 'src/screens/Screens'
import { call, put, takeEvery } from 'typed-redux-saga'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { restoreMnemonicComplete } from 'wallet/src/features/wallet/slice'
import i18n from 'wallet/src/i18n/i18n'

/**
 * Watch when we've restored a mnemonic (new phone migration)
 */
export function* restoreMnemonicCompleteWatcher() {
  yield* takeEvery(restoreMnemonicComplete, onRestoreMnemonicComplete)
}

function* onRestoreMnemonicComplete() {
  yield* put(
    pushNotification({
      type: AppNotificationType.Success,
      title: i18n.t('notification.restore.success'),
    })
  )
  yield* call(dispatchNavigationAction, StackActions.replace(Screens.Home))
}

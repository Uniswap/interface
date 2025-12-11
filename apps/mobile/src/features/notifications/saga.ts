import { OneSignal } from 'react-native-onesignal'
import { NotifSettingType, OneSignalUserTagField } from 'src/features/notifications/constants'
import { selectAllPushNotificationSettings } from 'src/features/notifications/selectors'
import { initNotifsForNewUser, updateNotifSettings } from 'src/features/notifications/slice'
import { call, select, takeEvery } from 'typed-redux-saga'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { selectActiveAccountAddress, selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'
import { removeAccounts, setAccountAsActive } from 'wallet/src/features/wallet/slice'

export function* pushNotificationsWatcherSaga() {
  yield* call(syncWithOneSignal)
  yield* call(syncActiveWalletAddressTag)

  yield* takeEvery(initNotifsForNewUser.type, initNewUser)
  yield* takeEvery(updateNotifSettings.type, syncWithOneSignal)
  yield* takeEvery(finalizeTransaction.type, processFinalizedTx)
  yield* takeEvery(setAccountAsActive.type, syncActiveWalletAddressTag)
  yield* takeEvery(removeAccounts.type, syncActiveWalletAddressTag)
}

/**
 * Due to our app not having an account abstraction, OneSignal values are device-specific.
 * So, this is intentionally driving local changes as the source of truth,
 * since OneSignal is not a fully reliable and scalable backend.
 * If we ever need to share settings across devices, this will need to change.
 */
function* syncWithOneSignal() {
  const finishedOnboarding = yield* select(selectFinishedOnboarding)

  if (finishedOnboarding) {
    const { generalUpdatesEnabled } = yield* select(selectAllPushNotificationSettings)

    yield* call(OneSignal.User.addTags, {
      [NotifSettingType.GeneralUpdates]: generalUpdatesEnabled.toString(),
    })
  }
}

function* initNewUser() {
  yield* call(OneSignal.User.addTags, {
    [NotifSettingType.GeneralUpdates]: 'true',
  })
}

function* processFinalizedTx(action: ReturnType<typeof finalizeTransaction>) {
  const isSuccessfulSwap =
    action.payload.typeInfo.type === TransactionType.Swap && action.payload.status === TransactionStatus.Success
  if (isSuccessfulSwap) {
    yield* call(
      OneSignal.User.addTag,
      OneSignalUserTagField.SwapLastCompletedAt,
      Math.floor(Date.now() / ONE_SECOND_MS).toString(),
    )
  }
}

function* syncActiveWalletAddressTag() {
  const activeAddress = yield* select(selectActiveAccountAddress)
  if (activeAddress) {
    yield* call(OneSignal.User.addTag, OneSignalUserTagField.ActiveWalletAddress, activeAddress)
  } else {
    yield* call(OneSignal.User.removeTag, OneSignalUserTagField.ActiveWalletAddress)
  }
}

import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import { appSelect } from 'src/app/hooks'
import {
  getFirebaseUidOrError,
  getFirestoreMetadataRef,
  getFirestorePushTokenRef,
  getFirestoreUidRef,
  getOneSignalUserIdOrError,
} from 'src/features/firebase/utils'
import { AccountType } from 'src/features/wallet/accounts/types'
import {
  EditAccountAction,
  editAccountActions,
  TogglePushNotificationParams,
} from 'src/features/wallet/editAccountSaga'
import { selectAccounts } from 'src/features/wallet/selectors'
import { addAccount, editAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { call, fork, put, takeEvery } from 'typed-redux-saga'

interface AccountMetadata {
  name?: string
  type?: AccountType
  avatar?: string
}

export function* firebaseDataWatcher() {
  yield* fork(firebaseAddAddressWatcher)
  yield* fork(firebaseEditAddressWatcher)
}

export function* firebaseAddAddressWatcher() {
  yield* takeEvery(addAccount.type, addAccountToFirebase)
}

export function* firebaseEditAddressWatcher() {
  yield* takeEvery(editAccountActions.trigger, editAccountDataInFirebase)
}

export function* addAccountToFirebase(actionData: ReturnType<typeof addAccount>) {
  const {
    payload: { address },
  } = actionData
  try {
    yield* call(mapFirebaseUidToAddresses, [address])
  } catch (error) {
    logger.error('firebaseData', 'addAccountToFirebase', 'Error:', error)
  }
}

export function* editAccountDataInFirebase(
  actionData: ReturnType<typeof editAccountActions.trigger>
) {
  const { payload } = actionData
  const { type, address } = payload

  switch (type) {
    case EditAccountAction.Remove:
      yield* call(removeAccountFromFirebase, address)
      break
    case EditAccountAction.Rename:
      yield* call(renameAccountInFirebase, address, payload.newName)
      break
    case EditAccountAction.AddBackupMethod:
      // no-op
      break
    case EditAccountAction.RemoveBackupMethod:
      // no-op
      break
    case EditAccountAction.TogglePushNotificationParams:
      yield* call(updateFirebasePushNotificationsSettings, payload)
      break
    default:
      throw new Error(`Invalid EditAccountAction ${type}`)
  }
}

export function* removeAccountFromFirebase(address: Address) {
  try {
    yield* call(deleteAccountMetadata, address)
    yield* call(disassociatePushTokenFromAddresses, [address])
    yield* call(disassociateFirebaseUidFromAddresses, [address])
  } catch (error) {
    logger.error('firebaseData', 'removeAccountFromFirebase', 'Error:', error)
  }
}

export function* renameAccountInFirebase(address: Address, newName: string) {
  try {
    yield* call(updateAccountMetadata, address, { name: newName })
  } catch (error) {
    logger.error('firebaseData', 'renameAccountInFirebase', 'Error:', error)
  }
}

export function* updateFirebasePushNotificationsSettings(params: TogglePushNotificationParams) {
  const accounts = yield* appSelect(selectAccounts)
  const { address, enabled } = params
  const account = accounts[address]
  const { name, type } = account

  try {
    if (enabled) {
      if (name) {
        yield* call(updateAccountMetadata, address, { name, type })
      } else {
        yield* call(updateAccountMetadata, address, { type })
      }
      yield* call(mapPushTokenToAddresses, [address])
    } else {
      yield* call(disassociatePushTokenFromAddresses, [address])
    }

    yield* put(
      editAccount({
        address,
        updatedAccount: {
          ...account,
          pushNotificationsEnabled: enabled,
        },
      })
    )
  } catch (error) {
    logger.error('firebaseData', 'updateFirebasePushNotificationsSettings', 'Error:', error)
  }
}

export function* mapFirebaseUidToAddresses(addresses: Address[]) {
  const firebaseApp = firebase.app()
  const uid = getFirebaseUidOrError(firebaseApp)
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const uidRef = getFirestoreUidRef(firebaseApp, address)
    batch.set(uidRef, { [uid]: true }, { merge: true })
  })

  yield* call([batch, 'commit'])
}

export const mapPushTokenToAddresses = async (addresses: Address[]) => {
  const pushId = await getOneSignalUserIdOrError()
  const firebaseApp = firebase.app()
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const pushTokenRef = getFirestorePushTokenRef(firebaseApp, address)
    batch.set(
      pushTokenRef,
      { pushIds: firebase.firestore.FieldValue.arrayUnion(pushId) },
      { merge: true }
    )
  })

  await batch.commit()
}

export function* disassociateFirebaseUidFromAddresses(addresses: Address[]) {
  const firebaseApp = firebase.app()
  const uid = getFirebaseUidOrError(firebaseApp)
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const uidRef = getFirestoreUidRef(firebaseApp, address)
    batch.update(uidRef, { [uid]: firebase.firestore.FieldValue.delete() })
  })

  yield* call([batch, 'commit'])
}

export const disassociatePushTokenFromAddresses = async (addresses: Address[]) => {
  const pushId = await getOneSignalUserIdOrError()
  const firebaseApp = firebase.app()
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const pushTokenRef = getFirestorePushTokenRef(firebaseApp, address)
    batch.set(pushTokenRef, { pushIds: firebase.firestore.FieldValue.arrayRemove(pushId) })
  })

  await batch.commit()
}

export const updateAccountMetadata = async (address: Address, metadata: AccountMetadata) => {
  const firebaseApp = firebase.app()
  const pushId = await getOneSignalUserIdOrError()
  const metadataRef = getFirestoreMetadataRef(firebaseApp, address, pushId)
  await metadataRef.set(metadata, { merge: true })
}

export const deleteAccountMetadata = async (address: Address) => {
  const firebaseApp = firebase.app()
  const pushId = await getOneSignalUserIdOrError()
  const metadataRef = getFirestoreMetadataRef(firebaseApp, address, pushId)
  await metadataRef.delete()
}

import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import {
  getFirebaseUidOrError,
  getFirestoreMetadataRef,
  getFirestorePushTokenRef,
  getFirestoreUidRef,
  getOneSignalUserIdOrError,
} from 'src/features/firebase/utils'
import { AccountBase, AccountType } from 'src/features/wallet/accounts/types'
import { DEMO_ACCOUNT_ADDRESS } from 'src/features/wallet/accounts/useTestAccount'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { addAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { call, fork, takeEvery } from 'typed-redux-saga'

type AccountMetadata = Pick<AccountBase, 'name'> & { avatar?: string }

export function* firebaseDataWatcher() {
  yield* fork(firebaseAddAddressWatcher)
  yield* fork(firebaseEditAddressWatcher)
}

export function* firebaseAddAddressWatcher() {
  yield* takeEvery(addAccount.type, addAccountDataToFirebase)
}

export function* firebaseEditAddressWatcher() {
  yield* takeEvery(editAccountActions.trigger, editAccountDataInFirebase)
}

export function* addAccountDataToFirebase(actionData: ReturnType<typeof addAccount>) {
  const {
    payload: { address, name, type },
  } = actionData
  yield* call(mapAddressesToFirebaseUid, [address])

  if (name) {
    yield* call(updateAccountMetadata, address, { name })
  }
  // Push notifcations are default off for watched addresses & our demo account
  if (type !== AccountType.Readonly && address !== DEMO_ACCOUNT_ADDRESS) {
    yield* call(mapAddressesToPushToken, [address])
  }
}

export function* editAccountDataInFirebase(
  actionData: ReturnType<typeof editAccountActions.trigger>
) {
  const { payload } = actionData
  const { type, address } = payload

  switch (type) {
    case EditAccountAction.Remove:
      yield* call(deleteAccountMetadata, address)
      yield* call(disassociateAddressesFromPushToken, [address])
      yield* call(disassociateAddressesFromFirebaseUid, [address])
      break
    case EditAccountAction.Rename:
      yield* call(updateAccountMetadata, address, { name: payload.newName })
      break
    case EditAccountAction.AddBackupMethod:
      // no-op
      break
    case EditAccountAction.EnablePushNotification:
      yield* call(mapAddressesToPushToken, [address])
      break
    case EditAccountAction.DisablePushNotification:
      yield* call(disassociateAddressesFromPushToken, [address])
      break
    default:
      throw new Error(`Invalid EditAccountAction ${type}`)
  }
}

export function* mapAddressesToFirebaseUid(addresses: Address[]) {
  try {
    const firebaseApp = firebase.app()
    const uid = getFirebaseUidOrError(firebaseApp)
    const batch = firestore(firebaseApp).batch()
    addresses.forEach((address: string) => {
      const uidRef = getFirestoreUidRef(firebaseApp, address)
      batch.set(uidRef, { [uid]: true }, { merge: true })
    })

    yield* call([batch, 'commit'])
  } catch (error: any) {
    logger.error('firebaseData', 'mapAddressesToFirebaseUid', error?.message)
  }
}

export const mapAddressesToPushToken = async (addresses: Address[]) => {
  try {
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
  } catch (error: any) {
    logger.error('firebaseData', 'mapAddressesToPushToken', error?.message)
  }
}

export function* disassociateAddressesFromFirebaseUid(addresses: Address[]) {
  try {
    const firebaseApp = firebase.app()
    const uid = getFirebaseUidOrError(firebaseApp)
    const batch = firestore(firebaseApp).batch()
    addresses.forEach((address: string) => {
      const uidRef = getFirestoreUidRef(firebaseApp, address)
      batch.update(uidRef, { [uid]: firebase.firestore.FieldValue.delete() })
    })

    yield* call([batch, 'commit'])
  } catch (error: any) {
    logger.error('firebaseData', 'disassociateAddressesFromFirebaseUid', error?.message)
  }
}

export const disassociateAddressesFromPushToken = async (addresses: Address[]) => {
  try {
    const pushId = await getOneSignalUserIdOrError()
    const firebaseApp = firebase.app()
    const batch = firestore(firebaseApp).batch()
    addresses.forEach((address: string) => {
      const pushTokenRef = getFirestorePushTokenRef(firebaseApp, address)
      batch.set(pushTokenRef, { pushIds: firebase.firestore.FieldValue.arrayRemove(pushId) })
    })

    await batch.commit()
  } catch (error: any) {
    logger.error('firebaseData', 'disassociateAddressesFromPushToken', error?.message)
  }
}

export const updateAccountMetadata = async (address: Address, metadata: AccountMetadata) => {
  try {
    const firebaseApp = firebase.app()
    const uid = getFirebaseUidOrError(firebaseApp)
    const metadataRef = getFirestoreMetadataRef(firebaseApp, address, uid)
    await metadataRef.set(metadata, { merge: true })
  } catch (error: any) {
    logger.error('firebaseData', 'updateAccountMetadata', error?.message)
  }
}

export const deleteAccountMetadata = async (address: Address) => {
  try {
    const firebaseApp = firebase.app()
    const uid = getFirebaseUidOrError(firebaseApp)
    const metadataRef = getFirestoreMetadataRef(firebaseApp, address, uid)
    await metadataRef.delete()
  } catch (error: any) {
    logger.error('firebaseData', 'deleteAccountMetadata', error?.message)
  }
}

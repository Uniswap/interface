import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import { appSelect } from 'src/app/hooks'
import {
  getFirebaseUidOrError,
  getFirestoreMetadataRef,
  getFirestoreUidRef,
  getOneSignalUserIdOrError,
} from 'src/features/firebase/utils'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { TogglePushNotificationParams } from 'src/features/wallet/editAccountSaga'
import { makeSelectAccountNotificationSetting } from 'src/features/wallet/selectors'
import { editAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { call, put } from 'typed-redux-saga'

interface AccountMetadata {
  name?: string
  type?: AccountType
  avatar?: string
}

function* addAccountToFirebase(account: Account) {
  const { name, type, address } = account

  try {
    yield* call(mapFirebaseUidToAddresses, [address])
    yield* call(updateAccountMetadata, address, { type, ...(name ? { name } : {}) })
  } catch (error) {
    logger.error('firebaseData', 'addAccountToFirebase', 'Error:', error)
  }
}

export function* removeAccountFromFirebase(address: Address) {
  try {
    yield* call(deleteAccountData, address)
    yield* call(disassociateFirebaseUidFromAddresses, [address])
  } catch (error) {
    logger.error('firebaseData', 'removeAccountFromFirebase', 'Error:', error)
  }
}

export function* renameAccountInFirebase(address: Address, newName: string) {
  try {
    const notificationsEnabled = yield* appSelect(makeSelectAccountNotificationSetting(address))
    if (!notificationsEnabled) return
    yield* call(updateAccountMetadata, address, { name: newName })
  } catch (error) {
    logger.error('firebaseData', 'renameAccountInFirebase', 'Error:', error)
  }
}

export function* toggleFirebaseNotificationSettings({
  address,
  enabled,
  account,
}: TogglePushNotificationParams & { account: Account }) {
  try {
    if (enabled) {
      yield* call(addAccountToFirebase, account)
    } else {
      yield* call(removeAccountFromFirebase, address)
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
    logger.error('firebaseData', 'toggleFirebaseNotificationSettings', 'Error:', error)
  }
}

function* mapFirebaseUidToAddresses(addresses: Address[]) {
  const firebaseApp = firebase.app()
  const uid = getFirebaseUidOrError(firebaseApp)
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const uidRef = getFirestoreUidRef(firebaseApp, address)
    batch.set(uidRef, { [uid]: true }, { merge: true })
  })

  yield* call([batch, 'commit'])
}

function* disassociateFirebaseUidFromAddresses(addresses: Address[]) {
  const firebaseApp = firebase.app()
  const uid = getFirebaseUidOrError(firebaseApp)
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const uidRef = getFirestoreUidRef(firebaseApp, address)
    batch.update(uidRef, { [uid]: firebase.firestore.FieldValue.delete() })
  })

  yield* call([batch, 'commit'])
}

const updateAccountMetadata = async (address: Address, metadata: AccountMetadata) => {
  const firebaseApp = firebase.app()
  const pushId = await getOneSignalUserIdOrError()
  const metadataRef = getFirestoreMetadataRef(firebaseApp, address, pushId)
  await metadataRef.set(metadata, { merge: true })
}

const deleteAccountData = async (address: Address) => {
  const firebaseApp = firebase.app()
  const pushId = await getOneSignalUserIdOrError()
  const metadataRef = getFirestoreMetadataRef(firebaseApp, address, pushId)
  await metadataRef.delete()
}

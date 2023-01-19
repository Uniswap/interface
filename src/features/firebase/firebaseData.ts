import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import { CallEffect, ForkEffect, PutEffect, SelectEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { selectTestnetsAreEnabled } from 'src/features/chains/chainsSlice'
import {
  getFirebaseUidOrError,
  getFirestoreMetadataRef,
  getFirestoreUidRef,
  getOneSignalUserIdOrError,
} from 'src/features/firebase/utils'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import {
  EditAccountAction,
  editAccountActions,
  TogglePushNotificationParams,
} from 'src/features/wallet/editAccountSaga'
import { makeSelectAccountNotificationSetting, selectAccounts } from 'src/features/wallet/selectors'
import { editAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { getKeys } from 'src/utils/objects'
import { call, put, select, takeEvery } from 'typed-redux-saga'

interface AccountMetadata {
  name?: string
  type?: AccountType
  avatar?: string
  testnetsEnabled?: boolean
}

// Can't merge with `editAccountSaga` because it can't handle simultaneous actions
export function* firebaseDataWatcher(): Generator<ForkEffect<never>, void, unknown> {
  yield* takeEvery(editAccountActions.trigger, editAccountDataInFirebase)
}

function* editAccountDataInFirebase(
  actionData: ReturnType<typeof editAccountActions.trigger>
): Generator<CallEffect<void>, void, unknown> {
  const { payload } = actionData
  const { type, address } = payload

  switch (type) {
    case EditAccountAction.Remove:
      yield* call(removeAccountFromFirebase, address, payload.notificationsEnabled)
      break
    case EditAccountAction.Rename:
      yield* call(renameAccountInFirebase, address, payload.newName)
      break
    case EditAccountAction.TogglePushNotification:
      yield* call(toggleFirebaseNotificationSettings, payload)
      break
    case EditAccountAction.ToggleTestnetSettings:
      yield* call(updateFirebaseMetadata, address, { testnetsEnabled: payload.enabled })
      break
    default:
      break
  }
}

function* addAccountToFirebase(
  account: Account
): Generator<SelectEffect | CallEffect<void>, void, unknown> {
  const { name, type, address } = account
  const testnetsEnabled = yield* select(selectTestnetsAreEnabled)

  try {
    yield* call(mapFirebaseUidToAddresses, [address])
    yield* call(updateFirebaseMetadata, address, { type, name, testnetsEnabled })
  } catch (error) {
    logger.error('firebaseData', 'addAccountToFirebase', 'Error:', error)
  }
}

export function* removeAccountFromFirebase(
  address: Address,
  notificationsEnabled: boolean
): Generator<CallEffect<void>, void, unknown> {
  try {
    if (!notificationsEnabled) return
    yield* call(deleteFirebaseMetadata, address)
    yield* call(disassociateFirebaseUidFromAddresses, [address])
  } catch (error) {
    logger.error('firebaseData', 'removeAccountFromFirebase', 'Error:', error)
  }
}

export function* renameAccountInFirebase(
  address: Address,
  newName: string
): Generator<SelectEffect | CallEffect<void>, void, unknown> {
  try {
    const notificationsEnabled = yield* appSelect(makeSelectAccountNotificationSetting(address))
    if (!notificationsEnabled) return
    yield* call(updateFirebaseMetadata, address, { name: newName })
  } catch (error) {
    logger.error('firebaseData', 'renameAccountInFirebase', 'Error:', error)
  }
}

export function* toggleFirebaseNotificationSettings({
  address,
  enabled,
}: TogglePushNotificationParams): Generator<
  | SelectEffect
  | CallEffect<void>
  | PutEffect<{
      payload: {
        address: string
        updatedAccount: Account
      }
      type: string
    }>,
  void,
  unknown
> {
  try {
    const accounts = yield* appSelect(selectAccounts)
    const account = accounts[address]
    if (!account) throw new Error(`Account not found for address ${address}`)

    if (enabled) {
      yield* call(addAccountToFirebase, account)
    } else {
      yield* call(removeAccountFromFirebase, address, true)
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

async function mapFirebaseUidToAddresses(addresses: Address[]): Promise<void> {
  const firebaseApp = firebase.app()
  const uid = getFirebaseUidOrError(firebaseApp)
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const uidRef = getFirestoreUidRef(firebaseApp, address)
    batch.set(uidRef, { [uid]: true }, { merge: true })
  })

  await batch.commit()
}

async function disassociateFirebaseUidFromAddresses(addresses: Address[]): Promise<void> {
  const firebaseApp = firebase.app()
  const uid = getFirebaseUidOrError(firebaseApp)
  const batch = firestore(firebaseApp).batch()
  addresses.forEach((address: string) => {
    const uidRef = getFirestoreUidRef(firebaseApp, address)
    batch.update(uidRef, { [uid]: firebase.firestore.FieldValue.delete() })
  })

  await batch.commit()
}

async function updateFirebaseMetadata(address: Address, metadata: AccountMetadata): Promise<void> {
  try {
    const firebaseApp = firebase.app()
    const pushId = await getOneSignalUserIdOrError()
    const metadataRef = getFirestoreMetadataRef(firebaseApp, address, pushId)

    // Firestore does not support updating properties with an `undefined` value so must strip them out
    const metadataWithDefinedPropsOnly = getKeys(metadata).reduce(
      (obj: Record<string, unknown>, prop) => {
        const value = metadata[prop]
        if (value !== undefined) obj[prop] = value
        return obj
      },
      {}
    )

    await metadataRef.set(metadataWithDefinedPropsOnly, { merge: true })
  } catch (error) {
    logger.error('firebaseData', 'updateFirebaseMetadata', 'Error:', error)
  }
}

async function deleteFirebaseMetadata(address: Address): Promise<void> {
  const firebaseApp = firebase.app()
  const pushId = await getOneSignalUserIdOrError()
  const metadataRef = getFirestoreMetadataRef(firebaseApp, address, pushId)
  await metadataRef.delete()
}

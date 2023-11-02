import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import { appSelect } from 'src/app/hooks'
import {
  getFirebaseUidOrError,
  getFirestoreMetadataRef,
  getFirestoreUidRef,
} from 'src/features/firebase/utils'
import { getOneSignalUserIdOrError } from 'src/features/notifications/Onesignal'
import { call, put, takeEvery } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { getKeys } from 'utilities/src/primitives/objects'
import {
  EditAccountAction,
  editAccountActions,
  TogglePushNotificationParams,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import {
  makeSelectAccountNotificationSetting,
  selectAccounts,
} from 'wallet/src/features/wallet/selectors'
import { editAccount } from 'wallet/src/features/wallet/slice'

interface AccountMetadata {
  name?: string
  type?: AccountType
  avatar?: string
  testnetsEnabled?: boolean
  locale?: string
}

// Can't merge with `editAccountSaga` because it can't handle simultaneous actions
export function* firebaseDataWatcher() {
  yield* takeEvery(editAccountActions.trigger, editAccountDataInFirebase)
}

function* editAccountDataInFirebase(actionData: ReturnType<typeof editAccountActions.trigger>) {
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
    case EditAccountAction.UpdateLanguage:
      yield* call(updateFirebaseMetadata, address, { locale: payload.locale })
      break
    default:
      break
  }
}

function* addAccountToFirebase(account: Account) {
  const { name, type, address } = account
  const testnetsEnabled = false

  try {
    yield* call(mapFirebaseUidToAddresses, [address])
    yield* call(updateFirebaseMetadata, address, { type, name, testnetsEnabled })
  } catch (error) {
    logger.error(error, { tags: { file: 'firebaseDataSaga', function: 'addAccountToFirebase' } })
  }
}

export function* removeAccountFromFirebase(address: Address, notificationsEnabled: boolean) {
  try {
    if (!notificationsEnabled) return
    yield* call(deleteFirebaseMetadata, address)
    yield* call(disassociateFirebaseUidFromAddresses, [address])
  } catch (error) {
    logger.error(error, {
      tags: { file: 'firebaseDataSaga', function: 'removeAccountFromFirebase' },
    })
  }
}

export function* renameAccountInFirebase(address: Address, newName: string) {
  try {
    const notificationsEnabled = yield* appSelect(makeSelectAccountNotificationSetting(address))
    if (!notificationsEnabled) return
    yield* call(updateFirebaseMetadata, address, { name: newName })
  } catch (error) {
    logger.error(error, { tags: { file: 'firebaseDataSaga', function: 'renameAccountInFirebase' } })
  }
}

export function* toggleFirebaseNotificationSettings({
  address,
  enabled,
}: TogglePushNotificationParams) {
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
    logger.error(error, {
      tags: { file: 'firebaseDataSaga', function: 'toggleFirebaseNotificationSettings' },
    })
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
    logger.error(error, { tags: { file: 'firebaseDataSaga', function: 'updateFirebaseMetadata' } })
  }
}

async function deleteFirebaseMetadata(address: Address): Promise<void> {
  const firebaseApp = firebase.app()
  const pushId = await getOneSignalUserIdOrError()
  const metadataRef = getFirestoreMetadataRef(firebaseApp, address, pushId)
  await metadataRef.delete()
}

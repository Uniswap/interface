import firebase from '@react-native-firebase/app'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { appSelect } from 'src/app/hooks'
import {
  getFirebaseUidOrError,
  getFirestoreMetadataRef,
  getFirestoreUidRef,
} from 'src/features/firebase/utils'
import { getOneSignalUserIdOrError } from 'src/features/notifications/Onesignal'
import { call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { getKeys } from 'utilities/src/primitives/objects'
import { Language } from 'wallet/src/features/language/constants'
import { getLocale } from 'wallet/src/features/language/hooks'
import { selectCurrentLanguage, setCurrentLanguage } from 'wallet/src/features/language/slice'
import {
  EditAccountAction,
  TogglePushNotificationParams,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import {
  makeSelectAccountNotificationSetting,
  selectAccounts,
  selectNonPendingAccounts,
} from 'wallet/src/features/wallet/selectors'
import { editAccount, setAccountsNonPending } from 'wallet/src/features/wallet/slice'

interface AccountMetadata {
  name?: string
  type?: AccountType
  avatar?: string
  testnetsEnabled?: boolean
  locale?: string
}

function* initFirebase() {
  try {
    const firebaseAuth = auth()
    yield* call([firebaseAuth, 'signInAnonymously'])
    logger.debug('initFirebaseSaga', 'initFirebase', 'Firebase initialization successful')
  } catch (error) {
    logger.error(error, {
      tags: { file: 'firebaseDataSaga', function: 'initFirebase' },
    })
  }
}

export function* firebaseDataWatcher() {
  yield* call(initFirebase)

  // Can't merge with `editAccountSaga` because it can't handle simultaneous actions
  yield* takeEvery(editAccountActions.trigger, editAccountDataInFirebase)
  yield* takeLatest(setCurrentLanguage, syncLanguageWithFirebase)
  yield* takeEvery(setAccountsNonPending, syncAccountWithFirebase)
}

function* syncLanguageWithFirebase(actionData: ReturnType<typeof setCurrentLanguage>) {
  const accounts = yield* select(selectNonPendingAccounts)
  const addresses = Object.keys(accounts)

  yield* call(updateFirebaseLanguage, addresses, actionData.payload)
}

function* syncAccountWithFirebase(actionData: ReturnType<typeof setAccountsNonPending>) {
  const currentLanguage = yield* select(selectCurrentLanguage)
  yield* call(updateFirebaseLanguage, actionData.payload, currentLanguage)
}

function* updateFirebaseLanguage(addresses: Address[], language: Language) {
  const locale = getLocale(language)

  for (const address of addresses) {
    yield* put(
      editAccountActions.trigger({
        type: EditAccountAction.UpdateLanguage,
        address,
        locale,
      })
    )
  }
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
      yield* call(maybeUpdateFirebaseMetadata, address, { testnetsEnabled: payload.enabled })
      break
    case EditAccountAction.UpdateLanguage:
      yield* call(maybeUpdateFirebaseMetadata, address, { locale: payload.locale })
      break
    default:
      break
  }
}

function* addAccountToFirebase(account: Account) {
  const { name, type, address } = account
  const testnetsEnabled = false
  const currentLanguage = yield* select(selectCurrentLanguage)
  const currentLocale = getLocale(currentLanguage)

  try {
    yield* call(mapFirebaseUidToAddresses, [address])
    yield* call(updateFirebaseMetadata, address, {
      type,
      name,
      testnetsEnabled,
      locale: currentLocale,
    })
  } catch (error) {
    logger.error(error, { tags: { file: 'firebaseDataSaga', function: 'addAccountToFirebase' } })
  }
}

export function* removeAccountFromFirebase(address: Address, notificationsEnabled: boolean) {
  try {
    if (!notificationsEnabled) {
      return
    }
    yield* call(deleteFirebaseMetadata, address)
    yield* call(disassociateFirebaseUidFromAddresses, [address])
  } catch (error) {
    logger.error(error, {
      tags: { file: 'firebaseDataSaga', function: 'removeAccountFromFirebase' },
    })
  }
}

const selectAccountNotificationSetting = makeSelectAccountNotificationSetting()

export function* renameAccountInFirebase(address: Address, newName: string) {
  try {
    yield* call(maybeUpdateFirebaseMetadata, address, { name: newName })
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
    if (!account) {
      throw new Error(`Account not found for address ${address}`)
    }

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

function* maybeUpdateFirebaseMetadata(address: Address, metadata: AccountMetadata) {
  const notificationsEnabled = yield* select(selectAccountNotificationSetting, address)

  if (!notificationsEnabled) {
    return
  }

  yield* call(updateFirebaseMetadata, address, metadata)
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
        if (value !== undefined) {
          obj[prop] = value
        }
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

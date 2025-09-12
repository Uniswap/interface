import firebase from '@react-native-firebase/app'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { getFirebaseUidOrError, getFirestoreMetadataRef, getFirestoreUidRef } from 'src/features/firebase/utils'
import { getOneSignalUserIdOrError } from 'src/features/notifications/Onesignal'
import { all, call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Language } from 'uniswap/src/features/language/constants'
import { getLocale } from 'uniswap/src/features/language/hooks'
import { selectCurrentLanguage } from 'uniswap/src/features/settings/selectors'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { logger } from 'utilities/src/logger/logger'
import { getKeys } from 'utilities/src/primitives/objects'
import {
  EditAccountAction,
  editAccountActions,
  TogglePushNotificationParams,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { makeSelectAccountNotificationSetting, selectAccounts } from 'wallet/src/features/wallet/selectors'
import { addAccounts, editAccount } from 'wallet/src/features/wallet/slice'

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
  yield* call(syncNotificationsWithFirebase)

  // Can't merge with `editAccountSaga` because it can't handle simultaneous actions
  yield* takeEvery(editAccountActions.trigger, editAccountDataInFirebase)
  yield* takeLatest(setCurrentLanguage, syncLanguageWithFirebase)
  yield* takeEvery(addAccounts, syncAccountWithFirebase)
}

function* syncNotificationsWithFirebase() {
  try {
    const accounts = yield* select(selectAccounts)
    const addresses = Object.keys(accounts)

    for (const address of addresses) {
      const selectAccountNotificationSetting = yield* call(makeSelectAccountNotificationSetting)
      const notificationsEnabled = yield* select(selectAccountNotificationSetting, address)

      if (notificationsEnabled) {
        yield* call(mapFirebaseUidToAddresses, [address])
      } else {
        yield* call(deleteFirebaseMetadata, address)
        yield* call(disassociateFirebaseUidFromAddresses, [address])
      }
    }
  } catch (error) {
    // Permission denied error is expected for syncing when notifications are disabled
    if (!(error instanceof Error && error.message.includes('permission-denied'))) {
      logger.error(error, {
        tags: { file: 'firebaseDataSaga', function: 'syncNotificationsWithFirebase' },
      })
    }
  }
}

function* syncLanguageWithFirebase(actionData: ReturnType<typeof setCurrentLanguage>) {
  const accounts = yield* select(selectAccounts)
  const addresses = Object.keys(accounts)

  yield* call(updateFirebaseLanguage, addresses, actionData.payload)
}

function* syncAccountWithFirebase(actionData: ReturnType<typeof addAccounts>) {
  const currentLanguage = yield* select(selectCurrentLanguage)
  const addedAccountsAddresses = actionData.payload.map((account) => account.address)
  yield* call(updateFirebaseLanguage, addedAccountsAddresses, currentLanguage)
}

function* updateFirebaseLanguage(addresses: Address[], language: Language) {
  const locale = getLocale(language)

  for (const address of addresses) {
    yield* put(
      editAccountActions.trigger({
        type: EditAccountAction.UpdateLanguage,
        address,
        locale,
      }),
    )
  }
}

function* editAccountDataInFirebase(actionData: ReturnType<typeof editAccountActions.trigger>) {
  const { payload } = actionData

  switch (payload.type) {
    case EditAccountAction.Remove: {
      const accountsToRemove = payload.accounts
      yield* all(
        accountsToRemove.map((account: { address: Address; pushNotificationsEnabled?: boolean }) =>
          call(removeAccountFromFirebase, account.address, account.pushNotificationsEnabled),
        ),
      )
      return
    }
    case EditAccountAction.Rename:
      yield* call(renameAccountInFirebase, payload.address, payload.newName)
      break
    case EditAccountAction.TogglePushNotification:
      yield* call(toggleFirebaseNotificationSettings, payload)
      break
    case EditAccountAction.ToggleTestnetSettings:
      yield* call(maybeUpdateFirebaseMetadata, payload.address, { testnetsEnabled: payload.enabled })
      break
    case EditAccountAction.UpdateLanguage:
      yield* call(maybeUpdateFirebaseMetadata, payload.address, { locale: payload.locale })
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

function* removeAccountFromFirebase(address: Address, notificationsEnabled: boolean | undefined) {
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

function* renameAccountInFirebase(address: Address | undefined, newName: string) {
  if (!address) {
    throw new Error('Address is required for renameAccountInFirebase')
  }

  try {
    yield* call(maybeUpdateFirebaseMetadata, address, { name: newName })
  } catch (error) {
    logger.error(error, { tags: { file: 'firebaseDataSaga', function: 'renameAccountInFirebase' } })
  }
}

function* toggleFirebaseNotificationSettings({ address, enabled }: TogglePushNotificationParams) {
  if (!address) {
    throw new Error('Address is required for toggleFirebaseNotificationSettings')
  }

  try {
    const accounts = yield* select(selectAccounts)
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
      }),
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

function* maybeUpdateFirebaseMetadata(address: Address | undefined, metadata: AccountMetadata) {
  if (!address) {
    return
  }

  const selectAccountNotificationSetting = yield* call(makeSelectAccountNotificationSetting)
  const notificationsEnabled = yield* select(selectAccountNotificationSetting, address)

  if (!notificationsEnabled) {
    return
  }

  // syncs firebase mapping with the local state to avoid errors during metadata changes
  yield* call(syncNotificationsWithFirebase)

  yield* call(updateFirebaseMetadata, address, metadata)
}

async function updateFirebaseMetadata(address: Address, metadata: AccountMetadata): Promise<void> {
  try {
    const firebaseApp = firebase.app()
    const pushId = await getOneSignalUserIdOrError()
    const metadataRef = getFirestoreMetadataRef({ firebaseApp, address, pushId })

    // Firestore does not support updating properties with an `undefined` value so must strip them out
    const metadataWithDefinedPropsOnly = getKeys(metadata).reduce((obj: Record<string, unknown>, prop) => {
      const value = metadata[prop]
      if (value !== undefined) {
        obj[prop] = value
      }
      return obj
    }, {})

    await metadataRef.set(metadataWithDefinedPropsOnly, { merge: true })
  } catch (error) {
    logger.error(error, { tags: { file: 'firebaseDataSaga', function: 'updateFirebaseMetadata' } })
  }
}

async function deleteFirebaseMetadata(address: Address): Promise<void> {
  const firebaseApp = firebase.app()
  const pushId = await getOneSignalUserIdOrError()
  const metadataRef = getFirestoreMetadataRef({ firebaseApp, address, pushId })
  await metadataRef.delete()
}

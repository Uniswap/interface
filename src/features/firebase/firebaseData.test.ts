import dayjs from 'dayjs'
import { expectSaga } from 'redux-saga-test-plan'
import {
  addAccountToFirebase,
  deleteAccountMetadata,
  disassociateFirebaseUidFromAddresses,
  disassociatePushTokenFromAddresses,
  editAccountDataInFirebase,
  firebaseAddAddressWatcher,
  firebaseDataWatcher,
  firebaseEditAddressWatcher,
  mapFirebaseUidToAddresses,
  mapPushTokenToAddresses,
  updateAccountMetadata,
  updateFirebasePushNotificationsSettings,
} from 'src/features/firebase/firebaseData'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import {
  EditAccountAction,
  editAccountActions,
  EditAccountParams,
} from 'src/features/wallet/editAccountSaga'
import { addAccount } from 'src/features/wallet/walletSlice'

const MOCK_ADDRESS_1 = '0xaddress1'
const MOCK_ADDRESS_2 = '0xaddress2'
const MOCK_FIREBASE_UID = 'firebaseUid'

jest.mock('@react-native-firebase/app', () => ({
  app: () => ({ auth: () => ({ currentUser: { uid: MOCK_FIREBASE_UID } }) }),
}))

// jest.mock('@react-native-firebase/firestore', () => ({
//   collection: (collectionName: string) => {
//     if (collectionName === 'address_data') {
//       return () => ({
//         doc: (docName: string) => {
//           if (docName === 'metadata') {
//             return () => ({
//               collection: (address: string) => {
//                 if (address === '0xaddress1') {
//                   return () => ({
//                     doc: (docName1: string) => {
//                       if (docName1 === 'firebase_uids') {
//                         return () => ({ collection: () => ({ doc: () => ({ set: () => {} }) }) })
//                       }
//                     },
//                   })
//                 }
//               },
//             })
//           }
//         },
//       })
//     }
//   },
// }))

const readonlyAccount: Account = {
  type: AccountType.Readonly,
  address: MOCK_ADDRESS_1,
  name: 'READONLY ACCOUNT',
  timeImportedMs: dayjs().valueOf(),
}

const importedAccount: Account = {
  type: AccountType.Native,
  address: MOCK_ADDRESS_2,
  name: 'IMPORTED ACCOUNT',
  timeImportedMs: dayjs().valueOf(),
  derivationIndex: 3,
  mnemonicId: '0xmenonicId',
}

const importedNamelessAccount: Account = {
  type: AccountType.Native,
  address: MOCK_ADDRESS_2,
  timeImportedMs: dayjs().valueOf(),
  derivationIndex: 4,
  mnemonicId: '0xmenonicId',
}

const renamedAccount: EditAccountParams = {
  type: EditAccountAction.Rename,
  address: MOCK_ADDRESS_2,
  newName: 'NEW_NAME',
}

const removedAccount: EditAccountParams = {
  type: EditAccountAction.Remove,
  address: MOCK_ADDRESS_2,
}

describe(firebaseDataWatcher, () => {
  it('Triggers watchers successfully', () => {
    return expectSaga(firebaseDataWatcher)
      .dispatch(addAccount(readonlyAccount))
      .fork(firebaseAddAddressWatcher)
      .dispatch(editAccountActions.trigger(renamedAccount))
      .fork(firebaseEditAddressWatcher)
      .silentRun()
  })
})

// Re-enable tests when Firestore is mocked

describe(addAccountToFirebase, () => {
  it.skip('Adds to the UID mapping when an account is added', () => {
    return expectSaga(addAccountToFirebase, { payload: importedAccount, type: '' })
      .call(mapFirebaseUidToAddresses, [importedAccount.address])
      .silentRun()
  })
})

describe(editAccountDataInFirebase, () => {
  it.skip('Adds to the push notification mapping and updates metadata when notifications are enabled and account is named', () => {
    return expectSaga(updateFirebasePushNotificationsSettings, {
      address: MOCK_ADDRESS_1,
      enabled: true,
    })
      .withState({ wallet: { accounts: { [MOCK_ADDRESS_1]: readonlyAccount } } })
      .call(updateAccountMetadata, readonlyAccount.address, {
        name: readonlyAccount.name,
      })
      .call(mapPushTokenToAddresses, [readonlyAccount.address])
      .silentRun()
  })

  it.skip('Adds to the push notification mapping and does not update metadata when notifications are enabled and account is nameless', () => {
    return expectSaga(updateFirebasePushNotificationsSettings, {
      address: MOCK_ADDRESS_2,
      enabled: true,
    })
      .withState({ wallet: { accounts: { [MOCK_ADDRESS_2]: importedNamelessAccount } } })
      .call(mapPushTokenToAddresses, [importedNamelessAccount.address])
      .silentRun()
  })

  it.skip('Deletes metadata and disassociates the address when the user removes their account', () => {
    return expectSaga(editAccountDataInFirebase, { payload: removedAccount, type: '' })
      .call(deleteAccountMetadata, removedAccount.address)
      .call(disassociatePushTokenFromAddresses, [removedAccount.address])
      .call(disassociateFirebaseUidFromAddresses, [removedAccount.address])
      .silentRun()
  })

  it.skip('Updates metadata when a user renames an account', () => {
    return expectSaga(editAccountDataInFirebase, { payload: renamedAccount, type: '' })
      .call(updateAccountMetadata, renamedAccount.address, { name: renamedAccount.newName })
      .silentRun()
  })
})

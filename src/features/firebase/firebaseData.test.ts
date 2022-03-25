import { expectSaga } from 'redux-saga-test-plan'
import {
  addAccountDataToFirebase,
  deleteAccountMetadata,
  disassociateAddressesFromFirebaseUid,
  disassociateAddressesFromPushToken,
  editAccountDataInFirebase,
  firebaseAddAddressWatcher,
  firebaseDataWatcher,
  firebaseEditAddressWatcher,
  mapAddressesToFirebaseUid,
  mapAddressesToPushToken,
  updateAccountMetadata,
} from 'src/features/firebase/firebaseData'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import {
  EditAccountAction,
  editAccountActions,
  EditAccountParams,
} from 'src/features/wallet/editAccountSaga'
import { addAccount } from 'src/features/wallet/walletSlice'

const readonlyAccount: Account = {
  type: AccountType.Readonly,
  address: '0xaddress1',
  name: 'READONLY ACCOUNT',
}

const importedAccount: Account = {
  type: AccountType.Native,
  address: '0xaddress2',
  name: 'IMPORTED ACCOUNT',
}

const importedNamelessAccount: Account = {
  type: AccountType.Native,
  address: '0xaddress3',
}

const renamedAccount: EditAccountParams = {
  type: EditAccountAction.Rename,
  address: '0xaddress4',
  newName: 'NEW_NAME',
}

const removedAccount: EditAccountParams = {
  type: EditAccountAction.Remove,
  address: '0xaddress5',
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

describe(addAccountDataToFirebase, () => {
  it('Adds to the UID mapping, metadata, and push token mapping when it is a named, imported account ', () => {
    return expectSaga(addAccountDataToFirebase, { payload: importedAccount, type: '' })
      .call(mapAddressesToFirebaseUid, [importedAccount.address])
      .call(updateAccountMetadata, importedAccount.address, {
        name: importedAccount.name,
      })
      .call(mapAddressesToPushToken, [importedAccount.address])
      .silentRun()
  })

  it('Does not add to push token mapping when a read only account is added ', () => {
    return expectSaga(addAccountDataToFirebase, { payload: readonlyAccount, type: '' })
      .call(mapAddressesToFirebaseUid, [readonlyAccount.address])
      .call(updateAccountMetadata, readonlyAccount.address, {
        name: readonlyAccount.name,
      })
      .silentRun()
  })

  it('Does not add metadata if none is provided when adding an account', () => {
    return expectSaga(addAccountDataToFirebase, { payload: importedNamelessAccount, type: '' })
      .call(mapAddressesToFirebaseUid, [importedNamelessAccount.address])
      .call(mapAddressesToPushToken, [importedNamelessAccount.address])
      .silentRun()
  })
})

describe(editAccountDataInFirebase, () => {
  it('Deletes metadata and disassociates the address when the user removes their account', () => {
    return expectSaga(editAccountDataInFirebase, { payload: removedAccount, type: '' })
      .call(deleteAccountMetadata, removedAccount.address)
      .call(disassociateAddressesFromPushToken, [removedAccount.address])
      .call(disassociateAddressesFromFirebaseUid, [removedAccount.address])
      .silentRun()
  })

  it('Updates metadata when a user renames an account', () => {
    return expectSaga(editAccountDataInFirebase, { payload: renamedAccount, type: '' })
      .call(updateAccountMetadata, renamedAccount.address, { name: renamedAccount.newName })
      .silentRun()
  })
})

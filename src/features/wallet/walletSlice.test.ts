import { createStore, Store } from '@reduxjs/toolkit'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import {
  activateAccount,
  addAccount,
  markAsNonPending,
  removeAccount,
  removeAccounts,
  walletReducer,
  WalletState,
} from 'src/features/wallet/walletSlice'
import { getChecksumAddress } from 'src/utils/addresses'

const TEST_IMPORT_TIME_MS = 12345678912345
const ACCOUNT_1: Account = {
  type: AccountType.Readonly,
  address: '0x3ec345ba64e6c94430cc7ac1d833d76e81b1f9ea',
  name: 'Account 1',
  timeImportedMs: TEST_IMPORT_TIME_MS,
}
const ACCOUNT_2: Account = {
  type: AccountType.Readonly,
  address: '0x318ae69cb61494ca6245ec4f895beaaf7ddcb944',
  name: 'Account 2',
  timeImportedMs: TEST_IMPORT_TIME_MS,
}

describe(walletReducer, () => {
  let store: Store<WalletState>

  beforeEach(() => {
    store = createStore(walletReducer, {
      accounts: {},
      activeAccountAddress: null,
      flashbotsEnabled: false,
      isUnlocked: false,
      settings: {},
      replaceAccountOptions: {
        isReplacingAccount: false,
        skipToSeedPhrase: false,
      },
    })
  })

  it('adds account to wallet', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    expect(store.getState().accounts[getChecksumAddress(ACCOUNT_1.address)]).toEqual(ACCOUNT_1)
  })

  it('marks account as non-pending', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(markAsNonPending([ACCOUNT_1.address]))
    expect(store.getState().accounts[getChecksumAddress(ACCOUNT_1.address)]?.pending).toBe(false)
  })

  it('throws when marking unknown account as non-pending', () => {
    expect(() => store.dispatch(markAsNonPending([ACCOUNT_1.address]))).toThrow(
      `Cannot enable missing account ${getChecksumAddress(ACCOUNT_1.address)}`
    )
  })

  it('sets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(activateAccount(ACCOUNT_1.address))
    expect(store.getState().activeAccountAddress).toBe(getChecksumAddress(ACCOUNT_1.address))
  })

  it('throws when setting unknown active account', () => {
    expect(() => store.dispatch(activateAccount(ACCOUNT_1.address))).toThrow(
      `Cannot activate missing account ${getChecksumAddress(ACCOUNT_1.address)}`
    )
  })

  it('removes active account from wallet and resets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(addAccount(ACCOUNT_2))
    expect(Object.values(store.getState().accounts).length).toEqual(2)

    store.dispatch(activateAccount(ACCOUNT_2.address))
    expect(store.getState().activeAccountAddress).toBe(getChecksumAddress(ACCOUNT_2.address))

    // Removing ACCOUNT_2 should set the active account to ACCOUNT_1
    store.dispatch(removeAccount(ACCOUNT_2.address))
    expect(store.getState().activeAccountAddress).toBe(getChecksumAddress(ACCOUNT_1.address))

    // Removing the last account should set active account to null
    store.dispatch(removeAccount(ACCOUNT_1.address))
    expect(store.getState().activeAccountAddress).toBeNull()
    expect(store.getState().accounts).toEqual({})
  })

  it('removes all accounts from wallet and resets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(addAccount(ACCOUNT_2))
    expect(Object.values(store.getState().accounts).length).toEqual(2)

    store.dispatch(activateAccount(ACCOUNT_2.address))
    expect(store.getState().activeAccountAddress).toBe(getChecksumAddress(ACCOUNT_2.address))

    // Removing both accounts should set the active account to null
    store.dispatch(removeAccounts([ACCOUNT_1.address, ACCOUNT_2.address]))
    expect(store.getState().activeAccountAddress).toBeNull()
    expect(store.getState().accounts).toEqual({})
  })

  it('throws when removing unknown active account', () => {
    expect(() => store.dispatch(removeAccount(ACCOUNT_1.address))).toThrow(
      `Cannot remove missing account ${getChecksumAddress(ACCOUNT_1.address)}`
    )
  })

  it('throws when removing unknown active accounts', () => {
    expect(() => store.dispatch(removeAccounts([ACCOUNT_1.address, ACCOUNT_2.address]))).toThrow(
      `Cannot remove missing account ${getChecksumAddress(ACCOUNT_1.address)}`
    )
  })
})

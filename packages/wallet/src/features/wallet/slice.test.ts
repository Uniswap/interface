import { createStore, Store } from '@reduxjs/toolkit'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import {
  addAccount,
  removeAccount,
  removeAccounts,
  setAccountAsActive,
  setAccountsNonPending,
  SwapProtectionSetting,
  walletReducer,
  WalletState,
} from './slice'

const TEST_IMPORT_TIME_MS = 12345678912345
const ACCOUNT_1: Account = {
  type: AccountType.Readonly,
  address: '0x3ec345BA64e6C94430Cc7AC1d833d76E81B1F9eA',
  name: 'Account 1',
  timeImportedMs: TEST_IMPORT_TIME_MS,
}
const ACCOUNT_2: Account = {
  type: AccountType.Readonly,
  address: '0x318aE69CB61494ca6245Ec4f895bEAAf7dDCb944',
  name: 'Account 2',
  timeImportedMs: TEST_IMPORT_TIME_MS,
}

describe(walletReducer, () => {
  let store: Store<WalletState>

  beforeEach(() => {
    store = createStore(walletReducer, {
      accounts: {},
      activeAccountAddress: null,
      isUnlocked: false,
      settings: {
        swapProtection: SwapProtectionSetting.On,
        hideSmallBalances: true,
        hideSpamTokens: true,
      },
    })
  })

  it('adds account to wallet', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    expect(store.getState().accounts[ACCOUNT_1.address]).toEqual(ACCOUNT_1)
  })

  it('marks account as non-pending', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(setAccountsNonPending([ACCOUNT_1.address]))
    expect(store.getState().accounts[ACCOUNT_1.address]?.pending).toBe(false)
  })

  it('throws when marking unknown account as non-pending', () => {
    expect(() => store.dispatch(setAccountsNonPending([ACCOUNT_1.address]))).toThrow(
      `Cannot enable missing account ${ACCOUNT_1.address}`
    )
  })

  it('sets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(setAccountAsActive(ACCOUNT_1.address))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_1.address)
  })

  it('throws when setting unknown active account', () => {
    expect(() => store.dispatch(setAccountAsActive(ACCOUNT_1.address))).toThrow(
      `Cannot activate missing account ${ACCOUNT_1.address}`
    )
  })

  it('removes active account from wallet and resets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(addAccount(ACCOUNT_2))
    expect(Object.values(store.getState().accounts).length).toEqual(2)

    store.dispatch(setAccountAsActive(ACCOUNT_2.address))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_2.address)

    // Removing ACCOUNT_2 should set the active account to ACCOUNT_1
    store.dispatch(removeAccount(ACCOUNT_2.address))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_1.address)

    // Removing the last account should set active account to null
    store.dispatch(removeAccount(ACCOUNT_1.address))
    expect(store.getState().activeAccountAddress).toBeNull()
    expect(store.getState().accounts).toEqual({})
  })

  it('removes all accounts from wallet and resets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(addAccount(ACCOUNT_2))
    expect(Object.values(store.getState().accounts).length).toEqual(2)

    store.dispatch(setAccountAsActive(ACCOUNT_2.address))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_2.address)

    // Removing both accounts should set the active account to null
    store.dispatch(removeAccounts([ACCOUNT_1.address, ACCOUNT_2.address]))
    expect(store.getState().activeAccountAddress).toBeNull()
    expect(store.getState().accounts).toEqual({})
  })

  it('throws when removing unknown active account', () => {
    expect(() => store.dispatch(removeAccount(ACCOUNT_1.address))).toThrow(
      `Cannot remove missing account ${ACCOUNT_1.address}`
    )
  })

  it('throws when removing unknown active accounts', () => {
    expect(() => store.dispatch(removeAccounts([ACCOUNT_1.address, ACCOUNT_2.address]))).toThrow(
      `Cannot remove missing account ${ACCOUNT_1.address}`
    )
  })
})

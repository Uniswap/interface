import { createStore, Store } from '@reduxjs/toolkit'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import {
  addAccount,
  removeAccounts,
  SwapProtectionSetting,
  setAccountAsActive,
  WalletSliceState,
  walletReducer,
} from 'wallet/src/features/wallet/slice'

const TEST_IMPORT_TIME_MS = 12345678912345
const ACCOUNT_1: Account = {
  type: AccountType.Readonly,
  address: '0x3ec345BA64e6C94430Cc7AC1d833d76E81B1F9eA',
  name: 'Account 1',
  timeImportedMs: TEST_IMPORT_TIME_MS,
  pushNotificationsEnabled: true,
}
const ACCOUNT_2: Account = {
  type: AccountType.Readonly,
  address: '0x318aE69CB61494ca6245Ec4f895bEAAf7dDCb944',
  name: 'Account 2',
  timeImportedMs: TEST_IMPORT_TIME_MS,
  pushNotificationsEnabled: true,
}

describe(walletReducer, () => {
  let store: Store<WalletSliceState>

  beforeEach(() => {
    store = createStore(walletReducer, {
      accounts: {},
      activeAccountAddress: null,
      settings: {
        swapProtection: SwapProtectionSetting.On,
      },
      androidCloudBackupEmail: null,
    })
  })

  it('adds account to wallet', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    expect(store.getState().accounts[ACCOUNT_1.address]).toEqual(ACCOUNT_1)
  })

  it('sets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(setAccountAsActive(ACCOUNT_1.address))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_1.address)
  })

  it('throws when setting unknown active account', () => {
    expect(() => store.dispatch(setAccountAsActive(ACCOUNT_1.address))).toThrow(
      `Cannot activate missing account ${ACCOUNT_1.address}`,
    )
  })

  it('removes active account from wallet and resets active account', () => {
    store.dispatch(addAccount(ACCOUNT_1))
    store.dispatch(addAccount(ACCOUNT_2))
    expect(Object.values(store.getState().accounts).length).toEqual(2)

    store.dispatch(setAccountAsActive(ACCOUNT_2.address))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_2.address)

    // Removing ACCOUNT_2 should set the active account to ACCOUNT_1
    store.dispatch(removeAccounts([ACCOUNT_2.address]))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_1.address)

    // Removing the last account should set active account to null
    store.dispatch(removeAccounts([ACCOUNT_1.address]))
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
    expect(() => store.dispatch(removeAccounts([ACCOUNT_1.address]))).toThrow(
      `Cannot remove missing account ${ACCOUNT_1.address}`,
    )
  })

  it('throws when removing unknown active accounts', () => {
    expect(() => store.dispatch(removeAccounts([ACCOUNT_1.address, ACCOUNT_2.address]))).toThrow(
      `Cannot remove missing account ${ACCOUNT_1.address}`,
    )
  })
})

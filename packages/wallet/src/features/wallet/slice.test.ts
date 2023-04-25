import { createStore, Store } from '@reduxjs/toolkit'
import {
  activateAccount,
  addAccounts,
  walletReducer,
  WalletState,
} from 'wallet/src/features/wallet/slice'
import { Account, AccountType } from 'wallet/src/features/wallet/types'

const TEST_IMPORT_TIME_MS = 12345678912345
const ACCOUNT_1: Account = {
  type: AccountType.Readonly,
  address: '0x3ec345BA64e6C94430Cc7AC1d833d76E81B1F9eA',
  name: 'Account 1',
  timeImportedMs: TEST_IMPORT_TIME_MS,
}

describe(walletReducer, () => {
  let store: Store<WalletState>

  beforeEach(() => {
    store = createStore(walletReducer, {
      accounts: {},
      activeAccountAddress: null,
    })
  })

  it('adds account to wallet', () => {
    store.dispatch(addAccounts([ACCOUNT_1]))
    expect(store.getState().accounts[ACCOUNT_1.address]).toEqual(ACCOUNT_1)
  })

  it('sets active account', () => {
    store.dispatch(addAccounts([ACCOUNT_1]))
    store.dispatch(activateAccount(ACCOUNT_1.address))
    expect(store.getState().activeAccountAddress).toBe(ACCOUNT_1.address)
  })

  it('throws when setting unknown active account', () => {
    expect(() => store.dispatch(activateAccount(ACCOUNT_1.address))).toThrow(
      `Cannot activate missing account ${ACCOUNT_1.address}`
    )
  })

  // TODO: Add more test methods once we have more functions in the reducer
})

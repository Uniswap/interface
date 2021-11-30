import { VoidSigner } from '@ethersproject/abstract-signer'
import { Wallet } from '@ethersproject/wallet'
import { runSaga } from '@redux-saga/core'
import { PayloadAction } from '@reduxjs/toolkit'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { importAccount } from 'src/features/import/importAccountSaga'
import { ImportLocalAccountParams, ImportReadonlyAccountParams } from 'src/features/import/types'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'

const SAMPLE_SEED = [
  'dove',
  'lumber',
  'quote',
  'board',
  'young',
  'robust',
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
].join(' ')
const SAMPLE_SEED_ADDRESS = '0x82D56A352367453f74FC0dC7B071b311da373Fa6'

describe(importAccount, () => {
  it('imports local account', () => {
    const accountManager = new AccountManager()
    const params: ImportLocalAccountParams = { mnemonic: SAMPLE_SEED, name: 'WALLET' }

    const dispatched: PayloadAction[] = []

    runSaga(
      {
        dispatch: (action: PayloadAction) => {
          // collect dispatched actions to later assert
          dispatched.push(action)
        },
        context: {
          accounts: accountManager,
        },
      },
      importAccount,
      params
    )

    // assert on account created
    expect(accountManager.listAccounts().length).toEqual(1)
    expect(accountManager.getAccount(SAMPLE_SEED_ADDRESS).address).toEqual(SAMPLE_SEED_ADDRESS)
    expect(accountManager.getAccount(SAMPLE_SEED_ADDRESS).signer instanceof Wallet).toBeTruthy()
    // assert on dispatched actions
    expect(dispatched).toEqual([
      addAccount({ type: AccountType.local, address: SAMPLE_SEED_ADDRESS, name: 'WALLET' }),
      activateAccount(SAMPLE_SEED_ADDRESS),
      fetchBalancesActions.trigger(SAMPLE_SEED_ADDRESS),
    ])
  })

  it('imports readonly account', () => {
    const accountManager = new AccountManager()
    const params: ImportReadonlyAccountParams = { address: NULL_ADDRESS, name: 'READONLY' }

    const dispatched: PayloadAction[] = []

    runSaga(
      {
        dispatch: (action: PayloadAction) => {
          // collect dispatched actions to later assert
          dispatched.push(action)
        },
        context: {
          accounts: accountManager,
        },
      },
      importAccount,
      params
    )

    // assert on account created
    expect(accountManager.listAccounts().length).toEqual(1)
    expect(accountManager.getAccount(NULL_ADDRESS).address).toEqual(NULL_ADDRESS)
    expect(accountManager.getAccount(NULL_ADDRESS).signer instanceof VoidSigner).toBeTruthy()
    // assert on dispatched actions
    expect(dispatched).toEqual([
      addAccount({ type: AccountType.readonly, address: NULL_ADDRESS, name: 'READONLY' }),
      activateAccount(NULL_ADDRESS),
      fetchBalancesActions.trigger(NULL_ADDRESS),
    ])
  })
})

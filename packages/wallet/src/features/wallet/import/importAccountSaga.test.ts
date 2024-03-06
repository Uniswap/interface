import { runSaga } from '@redux-saga/core'
import { PayloadAction } from '@reduxjs/toolkit'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import {
  addAccounts,
  restoreMnemonicComplete,
  setAccountAsActive,
  unlockWallet,
} from 'wallet/src/features/wallet/slice'
import {
  SAMPLE_PASSWORD,
  SAMPLE_SEED,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
} from 'wallet/src/test/fixtures'
import { signerManager } from 'wallet/src/test/mocks'
import { importAccount } from './importAccountSaga'
import { ImportAccountType, ImportAddressAccountParams, ImportMnemonicAccountParams } from './types'

// uses , () => ({__mocks__
jest.mock('wallet/src/features/wallet/Keyring/crypto')
jest.mock('wallet/src/features/wallet/Keyring/Keyring')

describe(importAccount, () => {
  it('imports native account', async () => {
    const params: ImportMnemonicAccountParams = {
      validatedMnemonic: SAMPLE_SEED,
      validatedPassword: SAMPLE_PASSWORD,
      name: 'WALLET',
      type: ImportAccountType.Mnemonic,
      indexes: [0, 1],
    }

    const dispatched: PayloadAction[] = []

    await runSaga(
      {
        dispatch: (action: PayloadAction) => {
          // collect dispatched actions to later assert
          dispatched.push(action)
        },
        context: {
          accounts: signerManager,
        },
        getState: () => ({
          wallet: { accounts: [] },
        }),
      },
      importAccount,
      params
    ).toPromise()

    // assert on dispatched actions
    expect(dispatched).toEqual([
      addAccounts([
        {
          type: AccountType.SignerMnemonic,
          address: SAMPLE_SEED_ADDRESS_2,
          name: 'WALLET',
          pending: true,
          derivationIndex: 1,
          timeImportedMs: expect.any(Number),
          mnemonicId: SAMPLE_SEED_ADDRESS_1,
        },
      ]),
      addAccounts([
        {
          type: AccountType.SignerMnemonic,
          address: SAMPLE_SEED_ADDRESS_1,
          name: 'WALLET',
          pending: true,
          derivationIndex: 0,
          timeImportedMs: expect.any(Number),
          mnemonicId: SAMPLE_SEED_ADDRESS_1,
        },
      ]),
      setAccountAsActive(SAMPLE_SEED_ADDRESS_1),
      unlockWallet(),
    ])
  })

  it('imports only private key', async () => {
    const params: ImportMnemonicAccountParams = {
      validatedMnemonic: SAMPLE_SEED,
      validatedPassword: SAMPLE_PASSWORD,
      name: 'WALLET',
      type: ImportAccountType.Mnemonic,
      indexes: [0, 1],
    }

    const dispatched: PayloadAction[] = []

    await runSaga(
      {
        dispatch: (action: PayloadAction) => {
          // collect dispatched actions to later assert
          dispatched.push(action)
        },
        context: {
          accounts: signerManager,
        },
        getState: () => ({
          wallet: {
            accounts: [
              {
                type: AccountType.SignerMnemonic,
                derivationIndex: 0,
                mnemonicId: SAMPLE_SEED_ADDRESS_1,
              },
            ],
          },
        }),
      },
      importAccount,
      params
    ).toPromise()

    // assert on dispatched actions
    expect(dispatched).toEqual([restoreMnemonicComplete()])
  })

  it('imports readonly account', () => {
    const params: ImportAddressAccountParams = {
      address: SAMPLE_SEED_ADDRESS_1,
      name: 'READONLY',
      type: ImportAccountType.Address,
    }

    const dispatched: PayloadAction[] = []

    runSaga(
      {
        dispatch: (action: PayloadAction) => {
          // collect dispatched actions to later assert
          dispatched.push(action)
        },
        context: {
          accounts: signerManager,
        },
      },
      importAccount,
      params
    )

    // assert on dispatched actions
    expect(dispatched).toEqual([
      addAccounts([
        {
          type: AccountType.Readonly,
          address: SAMPLE_SEED_ADDRESS_1,
          name: 'READONLY',
          pending: true,
          timeImportedMs: expect.any(Number),
        },
      ]),
      setAccountAsActive(SAMPLE_SEED_ADDRESS_1),
      unlockWallet(),
    ])
  })
})

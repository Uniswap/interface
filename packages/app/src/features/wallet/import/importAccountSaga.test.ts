import { runSaga } from '@redux-saga/core'
import { PayloadAction } from '@reduxjs/toolkit'
import { NATIVE_ADDRESS } from 'app/src/constants/addresses'
import {
  SAMPLE_PASSWORD,
  SAMPLE_SEED,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  signerManager,
} from '../../../test/__fixtures__'
import { addAccounts } from '../slice'
import { AccountType } from '../types'
import { importAccount } from './importAccountSaga'
import {
  ImportMnemonicAccountParams,
  ImportAccountType,
  ImportAddressAccountParams,
} from './types'

// uses , () => ({__mocks__
jest.mock('../Keyring/crypto')
jest.mock('app/src/features/wallet/Keyring/Keyring')

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
      // activateAccount(SAMPLE_SEED_ADDRESS_1),
      // unlockWallet(),
    ])
  })

  it('imports readonly account', () => {
    const params: ImportAddressAccountParams = {
      address: NATIVE_ADDRESS,
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
          address: NATIVE_ADDRESS,
          name: 'READONLY',
          pending: true,
          timeImportedMs: expect.any(Number),
        },
      ]),
      // activateAccount(NATIVE_ADDRESS),
      // unlockWallet(),
    ])
  })
})

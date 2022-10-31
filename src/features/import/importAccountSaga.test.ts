import { runSaga } from '@redux-saga/core'
import { PayloadAction } from '@reduxjs/toolkit'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { importAccount } from 'src/features/import/importAccountSaga'
import {
  ImportAccountType,
  ImportAddressAccountParams,
  ImportMnemonicAccountParams,
} from 'src/features/import/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount, unlockWallet } from 'src/features/wallet/walletSlice'
import { signerManager } from 'src/test/fixtures'

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
  it('imports native account', async () => {
    const params: ImportMnemonicAccountParams = {
      validatedMnemonic: SAMPLE_SEED,
      name: 'WALLET',
      type: ImportAccountType.Mnemonic,
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
      addAccount({
        type: AccountType.SignerMnemonic,
        address: SAMPLE_SEED_ADDRESS,
        name: 'WALLET',
        pending: true,
        derivationIndex: 0,
        timeImportedMs: expect.any(Number),
        mnemonicId: SAMPLE_SEED_ADDRESS,
      }),
      activateAccount(SAMPLE_SEED_ADDRESS),
      unlockWallet(),
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
      addAccount({
        type: AccountType.Readonly,
        address: NATIVE_ADDRESS,
        name: 'READONLY',
        pending: true,
        timeImportedMs: expect.any(Number),
      }),
      activateAccount(NATIVE_ADDRESS),
      unlockWallet(),
    ])
  })
})

import { runSaga } from '@redux-saga/core'
import { PayloadAction } from '@reduxjs/toolkit'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { importAccount } from 'src/features/import/importAccountSaga'
import { ImportLocalAccountParams, ImportReadonlyAccountParams } from 'src/features/import/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
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
  it('imports local account', async () => {
    const params: ImportLocalAccountParams = { mnemonic: SAMPLE_SEED, name: 'WALLET' }

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
        type: AccountType.local,
        address: SAMPLE_SEED_ADDRESS,
        name: 'WALLET',
        mnemonic: SAMPLE_SEED,
      }),
      activateAccount(SAMPLE_SEED_ADDRESS),
      fetchBalancesActions.trigger(SAMPLE_SEED_ADDRESS),
    ])
  })

  it('imports readonly account', () => {
    const params: ImportReadonlyAccountParams = { address: NULL_ADDRESS, name: 'READONLY' }

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
      addAccount({ type: AccountType.readonly, address: NULL_ADDRESS, name: 'READONLY' }),
      activateAccount(NULL_ADDRESS),
      fetchBalancesActions.trigger(NULL_ADDRESS),
    ])
  })
})

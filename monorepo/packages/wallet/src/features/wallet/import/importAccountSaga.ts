import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { getChecksumAddress } from 'wallet/src/utils/addresses'
import { createMonitoredSaga } from 'wallet/src/utils/saga'
import dayjs from 'dayjs'
import { CallEffect } from 'redux-saga/effects'
import { all, call, put } from 'typed-redux-saga'
import { logger } from '../../logger/logger'
import { addAccounts } from '../slice'
import { Account, AccountType } from '../types'
import { ImportAccountParams, ImportAccountType } from './types'

export const IMPORT_WALLET_AMOUNT = 10

export function* importAccount(params: ImportAccountParams) {
  const { type, name } = params
  logger.debug('importAccountSaga', 'importAccount', 'Importing type:', type)

  if (type === ImportAccountType.Address) {
    yield* call(
      importAddressAccount,
      params.address,
      name,
      params.ignoreActivate
    )
  } else if (type === ImportAccountType.Mnemonic) {
    yield* call(
      importMnemonicAccounts,
      params.validatedMnemonic,
      params.validatedPassword,
      name,
      params.indexes,
      params.markAsActive,
      params.ignoreActivate
    )
    // } else if (type === ImportAccountType.RestoreBackup) {
    //   yield* call(importRestoreBackupAccounts, params.mnemonicId, params.indexes)
  } else {
    throw new Error('Unsupported import account type')
  }
}

function* importAddressAccount(
  address: string,
  name?: string,
  ignoreActivate?: boolean
): Generator<CallEffect<void>, void, unknown> {
  const formattedAddress = getChecksumAddress(address)
  const account: Account = {
    type: AccountType.Readonly,
    address: formattedAddress,
    name,
    pending: true,
    timeImportedMs: dayjs().valueOf(),
  }
  yield* call(onAccountImport, account, ignoreActivate)
}

/**
 * Imports an account with a seed phrase, and handles secure storage.
 * Storage is encrypted via the provided password. Password is discarded
 * after function execution.
 *
 *       [seed]
 *       [ pw ] ┌───────┐    ┌──────────┬────────────────────────┐
 *  User───────►│ Popup │    │Background│                        │
 *              └───┬───┘    ├──────────┘                        │
 *                  │        │  ┌─────────────────┐              │
 *                  └────────┼─►│ImportAccountSaga│              │
 *                    [seed] │  └┬────────────────┘              │
 *                    [ pw ] │   │                               │
 *                           │  ┌▼────────┐ [enc seed]┌─────────┐│
 *                           │  │ Keyring ├──────────►│ Storage ││
 *                           │  └─────┬─▲─┘           └─────────┘│
 *                           │ [seed] │ │ [encrypted seed]       │
 *                           │ [ pw ] │ │                        │
 *                           │      ┌─▼─┴──┐                     │
 *                           │      │Crypto│                     │
 *                           │      └──────┘                     │
 *                           └───────────────────────────────────┘
 */
function* importMnemonicAccounts(
  validatedMnemonic: string,
  validatedPassword: string,
  name?: string,
  indexes = [0],
  markAsActive?: boolean,
  ignoreActivate?: boolean
) {
  const mnemonicId = yield* call(
    [Keyring, Keyring.importMnemonic],
    validatedMnemonic,
    validatedPassword
  )
  // generate private keys and return addresses for all derivation indexes
  const addresses = yield* all(
    indexes.map((index) => {
      return call(
        [Keyring, Keyring.generateAndStorePrivateKey],
        mnemonicId,
        index,
        validatedPassword
      )
    })
  )

  if (!addresses[0])
    throw new Error('Cannot import account with undefined address')
  if (indexes[0] === undefined)
    throw new Error('Cannot import account with undefined derivation index')

  const accounts = addresses
    .slice(1, addresses.length)
    .map((address, index) => {
      const account: Account = {
        type: AccountType.SignerMnemonic,
        address,
        name,
        pending: true,
        timeImportedMs: dayjs().valueOf(),
        derivationIndex: index + 1,
        mnemonicId,
      }
      return account
    })
  yield* put(addAccounts(accounts))

  const activeAccount: Account = {
    type: AccountType.SignerMnemonic,
    address: addresses[0],
    name,
    pending: !markAsActive,
    timeImportedMs: dayjs().valueOf(),
    derivationIndex: indexes[0],
    mnemonicId,
  }
  yield* call(onAccountImport, activeAccount, ignoreActivate)
}

// function* importRestoreBackupAccounts(
//   mnemonicId: string,
//   indexes = [0]
// ): Generator<
//   | AllEffect<SagaGenerator<string, CallEffect<string>>>
//   | PutEffect<{
//       payload: Account[]
//       type: string
//     }>,
//   void,
//   unknown
// > {
//   // generate private keys and return addresses for all derivation indexes
//   const addresses = yield* all(
//     indexes.map((index) => {
//       return call(generateAndStorePrivateKey, mnemonicId, index)
//     })
//   )
//   const accounts = addresses.map((address, index) => {
//     const account: Account = {
//       type: AccountType.SignerMnemonic,
//       address,
//       pending: true,
//       timeImportedMs: dayjs().valueOf(),
//       derivationIndex: index,
//       mnemonicId,
//       backups: [BackupType.Cloud],
//     }
//     return account
//   })
//   yield* put(addAccounts(accounts))
// }

function* onAccountImport(account: Account, ignoreActivate?: boolean) {
  yield* put(addAccounts([account]))
  if (!ignoreActivate) {
    // yield* put(activateAccount(account.address))
  }
  // yield* put(unlockWallet())
  logger.debug(
    'importAccount',
    '',
    `New ${account.type} account imported: ${account.address}`
  )
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')

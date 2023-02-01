import dayjs from 'dayjs'
import { AllEffect, CallEffect, PutEffect } from 'redux-saga/effects'
import { ImportAccountParams, ImportAccountType } from 'src/features/import/types'
import { Account, AccountType, BackupType } from 'src/features/wallet/accounts/types'
import {
  activateAccount,
  addAccount,
  addAccounts,
  unlockWallet,
} from 'src/features/wallet/walletSlice'
import { generateAndStorePrivateKey, importMnemonic } from 'src/lib/RNEthersRs'
import { getChecksumAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { all, call, put, SagaGenerator } from 'typed-redux-saga'

export const IMPORT_WALLET_AMOUNT = 10

export function* importAccount(params: ImportAccountParams): Generator<
  | CallEffect<void>
  | CallEffect<
      Generator<
        | CallEffect<void>
        | CallEffect<string>
        | AllEffect<SagaGenerator<string, CallEffect<string>>>
        | PutEffect<{
            payload: Account[]
            type: string
          }>,
        void,
        unknown
      >
    >,
  void,
  unknown
> {
  const { type, name } = params
  logger.debug('importAccountSaga', 'importAccount', 'Importing type:', type)

  if (type === ImportAccountType.Address) {
    yield* call(importAddressAccount, params.address, name, params.ignoreActivate)
  } else if (type === ImportAccountType.Mnemonic) {
    yield* call(
      importMnemonicAccounts,
      params.validatedMnemonic,
      name,
      params.indexes,
      params.markAsActive,
      params.ignoreActivate
    )
  } else if (type === ImportAccountType.RestoreBackup) {
    yield* call(importRestoreBackupAccounts, params.mnemonicId, params.indexes)
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

function* importMnemonicAccounts(
  validatedMnemonic: string,
  name?: string,
  indexes = [0],
  markAsActive?: boolean,
  ignoreActivate?: boolean
): Generator<
  | CallEffect<string>
  | AllEffect<SagaGenerator<string, CallEffect<string>>>
  | PutEffect<{
      payload: Account[]
      type: string
    }>
  | CallEffect<void>,
  void,
  unknown
> {
  const mnemonicId = yield* call(importMnemonic, validatedMnemonic)
  // generate private keys and return addresses for all derivation indexes
  const addresses = yield* all(
    indexes.map((index) => {
      return call(generateAndStorePrivateKey, mnemonicId, index)
    })
  )

  if (!addresses[0]) throw new Error('Cannot import account with undefined address')
  if (indexes[0] === undefined)
    throw new Error('Cannot import account with undefined derivation index')

  const accounts = addresses.slice(1, addresses.length).map((address, index) => {
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

function* importRestoreBackupAccounts(
  mnemonicId: string,
  indexes = [0]
): Generator<
  | AllEffect<SagaGenerator<string, CallEffect<string>>>
  | PutEffect<{
      payload: Account[]
      type: string
    }>,
  void,
  unknown
> {
  // generate private keys and return addresses for all derivation indexes
  const addresses = yield* all(
    indexes.map((index) => {
      return call(generateAndStorePrivateKey, mnemonicId, index)
    })
  )
  const accounts = addresses.map((address, index) => {
    const account: Account = {
      type: AccountType.SignerMnemonic,
      address,
      pending: true,
      timeImportedMs: dayjs().valueOf(),
      derivationIndex: index,
      mnemonicId,
      backups: [BackupType.Cloud],
    }
    return account
  })
  yield* put(addAccounts(accounts))
}

function* onAccountImport(
  account: Account,
  ignoreActivate?: boolean
): Generator<
  | PutEffect<{
      payload: Account
      type: string
    }>
  | PutEffect<{
      payload: string
      type: string
    }>
  | PutEffect<{
      payload: undefined
      type: string
    }>,
  void,
  unknown
> {
  yield* put(addAccount(account))
  if (!ignoreActivate) {
    yield* put(activateAccount(account.address))
  }
  yield* put(unlockWallet())
  logger.debug('importAccount', '', `New ${account.type} account imported: ${account.address}`)
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')

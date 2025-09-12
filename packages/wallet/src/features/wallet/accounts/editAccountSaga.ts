import { all, call, put, select } from 'typed-redux-saga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { unique } from 'utilities/src/primitives/array'
import { Account, BackupType } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import { editAccount as editInStore, removeAccounts as removeAccountsInStore } from 'wallet/src/features/wallet/slice'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export enum EditAccountAction {
  AddBackupMethod = 'AddBackupMethod',
  RemoveBackupMethod = 'RemoveBackupMethod',
  Rename = 'Rename',
  Remove = 'Remove',
  TogglePushNotification = 'TogglePushNotification',
  ToggleTestnetSettings = 'ToggleTestnetSettings',
  UpdateLanguage = 'UpdateLanguage',
  // May need a reorder action here eventually
}
interface EditParamsBase {
  type: EditAccountAction
  address?: Address
}
interface RenameParams extends EditParamsBase {
  type: EditAccountAction.Rename
  newName: string
}

interface RemoveParams extends EditParamsBase {
  type: EditAccountAction.Remove
  accounts: Account[]
}

interface AddBackupMethodParams extends EditParamsBase {
  type: EditAccountAction.AddBackupMethod
  backupMethod: BackupType
}

interface RemoveBackupMethodParams extends EditParamsBase {
  type: EditAccountAction.RemoveBackupMethod
  backupMethod: BackupType
}

export interface TogglePushNotificationParams extends EditParamsBase {
  type: EditAccountAction.TogglePushNotification
  enabled: boolean
}

export interface ToggleTestnetSettingsParams extends EditParamsBase {
  type: EditAccountAction.ToggleTestnetSettings
  enabled: boolean
}

export interface UpdateLanguageParams extends EditParamsBase {
  type: EditAccountAction.UpdateLanguage
  locale: string
}

export type EditAccountParams =
  | AddBackupMethodParams
  | RemoveBackupMethodParams
  | RenameParams
  | RemoveParams
  | TogglePushNotificationParams
  | ToggleTestnetSettingsParams
  | UpdateLanguageParams

function* editAccount(params: EditAccountParams) {
  const { type, address } = params

  if (type === EditAccountAction.Remove) {
    yield* call(removeAccounts, params)
    return
  }

  if (!address) {
    throw new Error('Address is required for editAccount actions other than Remove')
  }

  const accounts = yield* select(selectAccounts)
  const account = accounts[address]

  if (!account) {
    throw new Error(`No account found for ${address}`)
  }

  switch (type) {
    case EditAccountAction.Rename:
      yield* call(renameAccount, params, account)
      break
    case EditAccountAction.AddBackupMethod:
      yield* call(addBackupMethod, params, account)
      break
    case EditAccountAction.RemoveBackupMethod:
      yield* call(removeBackupMethod, params, account)
      break
    default:
      break
  }

  logger.debug('editAccountSaga', 'editAccount', 'Account updated:', address)
}

function* renameAccount(params: RenameParams, account: Account) {
  const { newName } = params
  logger.debug('editAccountSaga', 'renameAccount', 'Renaming account', account.address, 'to ', newName)
  yield* put(
    editInStore({
      address: account.address,
      updatedAccount: {
        ...account,
        name: newName,
      },
    }),
  )
}

function* removeAccounts(params: RemoveParams) {
  const { accounts } = params
  const addresses = accounts.map((a) => a.address)
  logger.debug('editAccountSaga', 'removeAccounts', 'Removing accounts', addresses)
  yield* put(removeAccountsInStore(addresses))
  yield* all(addresses.map((address) => call([Keyring, Keyring.removePrivateKey], address)))
}

// Adds the backup to all accounts that share the same seed phrase
function* addBackupMethod(params: AddBackupMethodParams, account: Account) {
  if (account.type !== AccountType.SignerMnemonic) {
    return
  }

  const { backupMethod } = params

  const accounts = yield* select(selectAccounts)
  const mnemonicAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === account.mnemonicId,
  )

  const updatedBackups: BackupType[] = unique([...(account.backups ?? []), backupMethod])
  yield* all(
    mnemonicAccounts.map((mnemonicAccount: Account) => {
      return put(
        editInStore({
          address: mnemonicAccount.address,
          updatedAccount: {
            ...mnemonicAccount,
            backups: updatedBackups,
          },
        }),
      )
    }),
  )

  sendAnalyticsEvent(WalletEventName.BackupMethodAdded, {
    backupMethodType: backupMethod,
    newBackupCount: updatedBackups.length,
  })

  logger.debug(
    'editAccountSaga',
    'addBackupMethod',
    'Adding backup method',
    mnemonicAccounts.map((a) => a.address),
  )
}

// Removes the backup method from all accounts that share the same seed phrase
function* removeBackupMethod(params: RemoveBackupMethodParams, account: Account) {
  if (account.type !== AccountType.SignerMnemonic) {
    return
  }

  const { backupMethod } = params

  const accounts = yield* select(selectAccounts)
  const mnemonicAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === account.mnemonicId,
  )

  const updatedBackups = account.backups?.filter((backup) => backup !== backupMethod)

  yield* all(
    mnemonicAccounts.map((mnemonicAccount) => {
      return put(
        editInStore({
          address: mnemonicAccount.address,
          updatedAccount: {
            ...mnemonicAccount,
            backups: updatedBackups,
          },
        }),
      )
    }),
  )

  sendAnalyticsEvent(WalletEventName.BackupMethodRemoved, {
    backupMethodType: backupMethod,
    newBackupCount: updatedBackups?.length ?? 0,
  })

  logger.debug(
    'editAccountSaga',
    'removeBackupMethod',
    'Removing backup method',
    mnemonicAccounts.map((a) => a.address),
  )
}

export const {
  name: editAccountSagaName,
  wrappedSaga: editAccountSaga,
  reducer: editAccountReducer,
  actions: editAccountActions,
} = createMonitoredSaga({
  saga: editAccount,
  name: 'editAccount',
})

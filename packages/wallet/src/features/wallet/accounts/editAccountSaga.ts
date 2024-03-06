import { all, call, put } from 'typed-redux-saga'
import { isWeb } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { unique } from 'utilities/src/primitives/array'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { Account, AccountType, BackupType } from 'wallet/src/features/wallet/accounts/types'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'
import {
  editAccount as editInStore,
  removeAccounts as removeAccountsInStore,
  removeAccount as removeInStore,
} from 'wallet/src/features/wallet/slice'
import { appSelect } from 'wallet/src/state'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export enum EditAccountAction {
  AddBackupMethod = 'AddBackupMethod',
  RemoveBackupMethod = 'RemoveBackupMethod',
  Rename = 'Rename',
  Remove = 'Remove',
  RemoveBulk = 'RemoveBulk',
  TogglePushNotification = 'TogglePushNotification',
  ToggleTestnetSettings = 'ToggleTestnetSettings',
  UpdateLanguage = 'UpdateLanguage',
  // May need a reorder action here eventually
}
interface EditParamsBase {
  type: EditAccountAction
  address: Address
}
interface RenameParams extends EditParamsBase {
  type: EditAccountAction.Rename
  newName: string
}
interface RemoveParams extends EditParamsBase {
  type: EditAccountAction.Remove
  notificationsEnabled: boolean
}

interface RemoveBulkParams extends EditParamsBase {
  type: EditAccountAction.RemoveBulk
  addresses: Address[]
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
  | RemoveBulkParams
  | TogglePushNotificationParams
  | ToggleTestnetSettingsParams
  | UpdateLanguageParams

function* editAccount(params: EditAccountParams) {
  const { type, address } = params

  const accounts = yield* appSelect(selectAccounts)
  const account = accounts[address]

  if (!account) {
    throw new Error(`No account found for ${address}`)
  }

  switch (type) {
    case EditAccountAction.Rename:
      yield* call(renameAccount, params, account)
      break
    case EditAccountAction.Remove:
      yield* call(removeAccount, params)
      break
    case EditAccountAction.RemoveBulk:
      yield* call(removeAccounts, params)
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
  const { address, newName } = params
  logger.debug('editAccountSaga', 'renameAccount', 'Renaming account', address, 'to ', newName)
  yield* put(
    editInStore({
      address,
      updatedAccount: {
        ...account,
        name: newName,
      },
    })
  )
}

function* removeAccount(params: RemoveParams) {
  const { address } = params
  logger.debug('editAccountSaga', 'removeAccount', 'Removing account', address)
  // TODO [MOB-243] cleanup account artifacts in native-land (i.e. keystore)
  yield* put(removeInStore(address))
  if (isWeb) {
    // Adding multiple calls to this one function was causing race condition errors since `removeAccount` is often called in a loop so limiting to web for now
    yield* call([Keyring, Keyring.removePrivateKey], address)
  }
}

function* removeAccounts(params: RemoveBulkParams) {
  const { addresses } = params
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

  const accounts = yield* appSelect(selectAccounts)
  const mnemonicAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === account.mnemonicId
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
        })
      )
    })
  )

  logger.debug(
    'editAccountSaga',
    'addBackupMethod',
    'Adding backup method',
    mnemonicAccounts.map((a) => a.address)
  )
}

// Removes the backup method from all accounts that share the same seed phrase
function* removeBackupMethod(params: RemoveBackupMethodParams, account: Account) {
  if (account.type !== AccountType.SignerMnemonic) {
    return
  }

  const { backupMethod } = params

  const accounts = yield* appSelect(selectAccounts)
  const mnemonicAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === account.mnemonicId
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
        })
      )
    })
  )

  logger.debug(
    'editAccountSaga',
    'removeBackupMethod',
    'Removing backup method',
    mnemonicAccounts.map((a) => a.address)
  )
}

export const {
  name: editAccountSagaName,
  wrappedSaga: editAccountSaga,
  reducer: editAccountReducer,
  actions: editAccountActions,
} = createMonitoredSaga<EditAccountParams>(editAccount, 'editAccount')

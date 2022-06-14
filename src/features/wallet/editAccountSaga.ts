import { appSelect } from 'src/app/hooks'
import { Account, BackupType } from 'src/features/wallet/accounts/types'
import { selectAccounts } from 'src/features/wallet/selectors'
import {
  editAccount as editInStore,
  removeAccount as removeInStore,
} from 'src/features/wallet/walletSlice'
import { disconnectWCForAccount } from 'src/features/walletConnect/WalletConnect'
import { unique } from 'src/utils/array'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export enum EditAccountAction {
  AddBackupMethod = 'addbackupmethod',
  Rename = 'rename',
  Remove = 'remove',
  TogglePushNotificationParams = 'togglepushnotification',
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
}

interface AddBackupMethodParams extends EditParamsBase {
  type: EditAccountAction.AddBackupMethod
  backupMethod: BackupType
}
interface TogglePushNotificationParams extends EditParamsBase {
  type: EditAccountAction.TogglePushNotificationParams
  enabled: boolean
}

export type EditAccountParams =
  | AddBackupMethodParams
  | RenameParams
  | RemoveParams
  | TogglePushNotificationParams

function* editAccount(params: EditAccountParams) {
  const { type, address } = params

  const accounts = yield* appSelect(selectAccounts)
  const account = accounts[address]

  if (!account) throw new Error(`No account found for ${address}`)

  switch (type) {
    case EditAccountAction.Rename:
      yield* call(renameAccount, params, account)
      break
    case EditAccountAction.Remove:
      yield* call(removeAccount, params)
      break
    case EditAccountAction.AddBackupMethod:
      yield* call(addBackupMethod, params, account)
      break
    case EditAccountAction.TogglePushNotificationParams:
      break
    default:
      throw new Error(`Invalid edit action type: ${type}`)
  }

  logger.info('editAccountSaga', 'editAccount', 'Account updated:', address)
}

function* renameAccount(params: RenameParams, account: Account) {
  const { address, newName } = params
  logger.info('editAccountSaga', 'renameAccount', 'Renaming account', address, 'to ', newName)
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
  logger.info('editAccountSaga', 'removeAccount', 'Removing account', address)
  // TODO cleanup account artifacts in native-land (i.e. keystore)
  yield* put(removeInStore(address))
  yield* call(disconnectWCForAccount, address)
}

// TODO: should be per seed phrase
function* addBackupMethod(params: AddBackupMethodParams, account: Account) {
  const { address, backupMethod } = params
  logger.info('editAccountSaga', 'addBackupMethod', 'Adding backup method', address)
  yield* put(
    editInStore({
      address,
      updatedAccount: {
        ...account,
        backups: unique([...(account.backups ?? []), backupMethod]),
      },
    })
  )
}

export const {
  name: editAccountSagaName,
  wrappedSaga: editAccountSaga,
  reducer: editAccountReducer,
  actions: editAccountActions,
} = createMonitoredSaga<EditAccountParams>(editAccount, 'editAccount')

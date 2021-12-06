import { appSelect } from 'src/app/hooks'
import { AccountBase } from 'src/features/wallet/accounts/types'
import {
  accountsSelector,
  editAccount as editInStore,
  removeAccount as removeInStore,
} from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export enum EditAccountAction {
  Rename = 'rename',
  Remove = 'remove',
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
type EditAccountParams = RenameParams | RemoveParams

function* editAccount(params: EditAccountParams) {
  const { type, address } = params

  const accounts = yield* appSelect(accountsSelector)
  const account = accounts[address]

  if (type === EditAccountAction.Rename) {
    yield* call(renameAccount, params, account)
  } else if (type === EditAccountAction.Remove) {
    yield* call(removeAccount, params)
  } else {
    throw new Error(`Invalid edit action type: ${type}`)
  }

  logger.info('editAccountSaga', 'editAccount', 'New account created:', address)
}

function* renameAccount(params: RenameParams, account: AccountBase) {
  const { address, newName } = params
  logger.info('editAccountSaga', 'renameAccount', 'Renaming account', address)
  account.name = newName
  yield* put(
    editInStore({
      address,
      updatedAccount: {
        type: account.type,
        address,
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
}

export const {
  name: editAccountSagaName,
  wrappedSaga: editAccountSaga,
  reducer: editAccountReducer,
  actions: editAccountActions,
} = createMonitoredSaga<EditAccountParams>(editAccount, 'editAccount')

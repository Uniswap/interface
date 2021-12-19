import { Wallet } from 'ethers'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import {
  ImportAccountParams,
  ImportReadonlyAccountParams,
  isImportLocalAccountParams,
} from 'src/features/import/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { generateAndStorePrivateKey, importMnemonic } from 'src/lib/RNEthersRs'
import { logger } from 'src/utils/logger'
import { normalizeMnemonic } from 'src/utils/mnemonics'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export function* importAccount(params: ImportAccountParams) {
  let account: Account

  if (isImportLocalAccountParams(params)) {
    let { name, privateKey, mnemonic } = params

    name ??= 'Imported Account'
    let type = AccountType.local

    // TODO: refactor to small functions (importFromPrivateKey, importFromMnemonic, importFromAddress)
    if (privateKey) {
      const wallet = new Wallet(privateKey)
      const address = wallet.address
      account = { type, privateKey, name, address }
      logger.debug('importAccountSaga', 'importAccount', address, name, type)
    } else if (mnemonic) {
      type = AccountType.native
      const formattedMnemonic = normalizeMnemonic(mnemonic)
      const address = yield* call(importMnemonic, formattedMnemonic)
      yield* call(generateAndStorePrivateKey, address, 0)
      account = { type, address, name }
    } else {
      throw new Error('Expected either privateKey or mnemonic to be provided.')
    }
  } else {
    let { name, address } = params as ImportReadonlyAccountParams
    name ??= 'Watched Account'
    const type = AccountType.readonly
    account = { type, address, name }
  }

  yield* put(addAccount(account))
  yield* put(activateAccount(account.address))
  yield* put(fetchBalancesActions.trigger(account.address))
  logger.info('importAccount', '', `New ${account.type} account imported: ${account.address}`)
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')

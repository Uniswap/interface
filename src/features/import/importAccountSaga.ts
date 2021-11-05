import { VoidSigner, Wallet } from 'ethers'
import { getWalletAccounts } from 'src/app/walletContext'
import { ETHEREUM_DERIVATION_PATH } from 'src/constants/accounts'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import {
  ImportAccountParams,
  ImportReadonlyAccountParams,
  isImportLocalAccountParams,
} from 'src/features/import/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { normalizeMnemonic } from 'src/utils/mnemonics'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export function* importAccount(params: ImportAccountParams) {
  const manager = yield* call(getWalletAccounts)

  let account: Account

  if (isImportLocalAccountParams(params)) {
    let { name, mnemonic, derivationPath } = params
    const formattedMnemonic = normalizeMnemonic(mnemonic)
    derivationPath ??= ETHEREUM_DERIVATION_PATH + '/0'
    name ??= 'Imported Account'
    const signer = Wallet.fromMnemonic(formattedMnemonic, derivationPath)
    const address = signer.address
    const type = AccountType.local
    account = { type, address, name, signer }
  } else {
    let { name, address } = params as ImportReadonlyAccountParams
    name ??= 'Watched Account'
    const signer = new VoidSigner(address)
    const type = AccountType.readonly
    account = { type, address, name, signer }
  }

  manager.addAccount(account)
  yield* put(addAccount((({ signer: _, ...accountInfo }) => accountInfo)(account)))
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

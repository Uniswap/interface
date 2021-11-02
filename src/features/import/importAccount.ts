import { Wallet } from 'ethers'
import { getWalletAccounts } from 'src/app/walletContext'
import { ETHEREUM_DERIVATION_PATH } from 'src/constants/accounts'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { normalizeMnemonic } from 'src/utils/mnemonics'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export interface ImportAccountParams {
  mnemonic: string
  derivationPath?: string
  locale?: string
  name?: string
}

export function* importAccount(params: ImportAccountParams) {
  const manager = yield* call(getWalletAccounts)
  let { mnemonic, derivationPath, name } = params
  const formattedMnemonic = normalizeMnemonic(mnemonic)
  derivationPath ??= ETHEREUM_DERIVATION_PATH + '/0'
  name ??= 'Imported Account'
  const signer = Wallet.fromMnemonic(formattedMnemonic, derivationPath)
  const address = signer.address
  const type = AccountType.local
  manager.addAccount({
    type,
    address,
    name,
    signer,
  })
  yield* put(addAccount({ type, address, name }))
  yield* put(activateAccount(address))
  yield* put(fetchBalancesActions.trigger(address))
  logger.info('importAccount', '', 'New account imported:', address)
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')

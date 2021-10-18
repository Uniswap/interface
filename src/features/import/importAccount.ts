import { Wallet } from 'ethers'
import { getWalletAccounts } from 'src/app/walletContext'
import { ETHEREUM_DERIVATION_PATH } from 'src/constants/accounts'
import { SupportedChainId } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { Address } from 'src/utils/Address'
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
  const address = Address.from(signer.address)
  const chainId = SupportedChainId.GOERLI
  const type = AccountType.local
  manager.addAccount({
    type,
    address,
    name,
    signer,
    chainId,
  })
  yield* put(addAccount({ type, address: address.toString(), name, chainId }))
  yield* put(activateAccount({ address: address.toString(), chainId }))
  yield* put(fetchBalancesActions.trigger({ type, address: address.toString(), name, chainId }))
  logger.info('New account imported:', address.toString())
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')

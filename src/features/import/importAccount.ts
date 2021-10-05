import { Wallet } from 'ethers'
import { ETHEREUM_DERIVATION_PATH } from 'src/constants/accounts'
import { SupportedChainId } from 'src/constants/chains'
import { accountManager } from 'src/features/wallet/accounts/AccountManager'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { Address } from 'src/utils/Address'
import { logger } from 'src/utils/logger'
import { normalizeMnemonic } from 'src/utils/mnemonics'
import { createMonitoredSaga } from 'src/utils/saga'
import { put } from 'typed-redux-saga'

export interface ImportAccountParams {
  mnemonic: string
  derivationPath?: string
  locale?: string
  name?: string
}

export function* importAccount(params: ImportAccountParams) {
  let { mnemonic, derivationPath, name } = params
  const formattedMnemonic = normalizeMnemonic(mnemonic)
  derivationPath ??= ETHEREUM_DERIVATION_PATH + '/0'
  name ??= 'Imported Account'
  const signer = Wallet.fromMnemonic(formattedMnemonic, derivationPath)
  const address = Address.from(signer.address)
  const chainId = SupportedChainId.GOERLI
  const type = AccountType.local
  accountManager.addAccount({
    type,
    address,
    name,
    signer,
    chainId,
  })
  yield* put(addAccount({ type, address: address.toString(), name, chainId }))
  yield* put(activateAccount({ address: address.toString(), chainId }))
  logger.info('New account imported:', address.toString())
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')

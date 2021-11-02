import { utils, Wallet } from 'ethers'
import { getWalletAccounts } from 'src/app/walletContext'
import { ETHEREUM_DERIVATION_PATH } from 'src/constants/accounts'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export function* createAccount() {
  const manager = yield* call(getWalletAccounts)
  const entropy = utils.randomBytes(32)
  const mnemonic = utils.entropyToMnemonic(entropy)
  const derivationPath = ETHEREUM_DERIVATION_PATH + '/0'
  const signer = Wallet.fromMnemonic(mnemonic, derivationPath)
  const address = signer.address
  const type = AccountType.local
  const name = 'New account'
  manager.addAccount({
    type,
    address,
    name,
    signer,
  })
  yield* put(addAccount({ type, address, name }))
  yield* put(activateAccount(address))
  logger.info('createAccount', '', 'New account created:', address)
}

export const {
  name: createAccountSagaName,
  wrappedSaga: createAccountSaga,
  reducer: createAccountReducer,
  actions: createAccountActions,
} = createMonitoredSaga<void>(createAccount, 'createAccount')

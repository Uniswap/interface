import { utils, Wallet } from 'ethers'
import { ETHEREUM_DERIVATION_PATH } from 'src/constants/accounts'
import { SupportedChainId } from 'src/constants/chains'
import { accountManager } from 'src/features/wallet/accounts/AccountManager'
import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { Address } from 'src/utils/Address'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { put } from 'typed-redux-saga'

export function* createAccount() {
  const entropy = utils.randomBytes(32)
  const mnemonic = utils.entropyToMnemonic(entropy)
  const derivationPath = ETHEREUM_DERIVATION_PATH + '/0'
  const signer = Wallet.fromMnemonic(mnemonic, derivationPath)
  const address = Address.from(signer.address)
  const chainId = SupportedChainId.GOERLI
  const type = AccountType.local
  const name = 'New account'
  accountManager.addAccount({
    type,
    address,
    name,
    signer,
    chainId,
  })
  yield* put(addAccount({ type, address: address.toString(), name, chainId }))
  yield* put(activateAccount({ address: address.toString(), chainId }))
  logger.info('New account created:', address.toString())
}

export const {
  name: createAccountSagaName,
  wrappedSaga: createAccountSaga,
  reducer: createAccountReducer,
  actions: createAccountActions,
} = createMonitoredSaga<void>(createAccount, 'createAccount')

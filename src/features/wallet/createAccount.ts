import { utils, Wallet } from 'ethers'
import { ETHEREUM_DERIVATION_PATH } from 'src/constants/accounts'
import { setAccount } from 'src/features/wallet/walletSlice'
import { logger } from 'src/utils/logger'
import { put } from 'typed-redux-saga'

export function* createAccount() {
  const entropy = utils.randomBytes(32)
  const mnemonic = utils.entropyToMnemonic(entropy)
  const derivationPath = ETHEREUM_DERIVATION_PATH + '/0'
  const account = Wallet.fromMnemonic(mnemonic, derivationPath)
  yield* put(setAccount({ address: account.address, derivationPath, chainId: 1 }))
  logger.info('New account:', account.address)
}

import { Wallet } from 'ethers'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { ImportAccountParams, ImportAccountType } from 'src/features/import/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount, unlockWallet } from 'src/features/wallet/walletSlice'
import { generateAndStorePrivateKey, importMnemonic } from 'src/lib/RNEthersRs'
import { ensureLeading0x, normalizeAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { normalizeMnemonic } from 'src/utils/mnemonics'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export function* importAccount(params: ImportAccountParams) {
  const { type, name } = params
  logger.debug('importAccountSaga', 'importAccount', 'Importing type:', type)

  if (type === ImportAccountType.Address) {
    yield* call(importAddressAccount, params.address, name ?? 'Watched Account')
  } else if (type === ImportAccountType.Mnemonic) {
    yield* call(importMnemonicAccount, params.mnemonic, name ?? 'Imported Account')
  } else if (type === ImportAccountType.PrivateKey) {
    yield* call(importPrivateKeyAccount, params.privateKey, name ?? 'Imported Account')
  } else {
    throw new Error('Unsupported import account type')
  }
}

function* importAddressAccount(address: string, name: string) {
  const formattedAddress = normalizeAddress(address)
  const account = { type: AccountType.readonly, address: formattedAddress, name }
  yield* call(onAccountImport, account)
}

function* importMnemonicAccount(mnemonic: string, name: string) {
  const formattedMnemonic = normalizeMnemonic(mnemonic)
  const address = yield* call(importMnemonic, formattedMnemonic)
  yield* call(generateAndStorePrivateKey, address, 0)
  const account: Account = { type: AccountType.native, address, name }
  yield* call(onAccountImport, account)
}

function* importPrivateKeyAccount(privateKey: string, name: string) {
  const wallet = new Wallet(ensureLeading0x(privateKey))
  const address = wallet.address
  const account: Account = { type: AccountType.local, privateKey, name, address }
  // TODO save key to keychain: https://github.com/Uniswap/mobile/issues/131
  yield* call(onAccountImport, account)
}

function* onAccountImport(account: Account) {
  yield* put(addAccount(account))
  yield* put(activateAccount(account.address))
  yield* put(fetchBalancesActions.trigger(account.address))
  yield* put(unlockWallet())
  logger.info('importAccount', '', `New ${account.type} account imported: ${account.address}`)
}

export const {
  name: importAccountSagaName,
  wrappedSaga: importAccountSaga,
  reducer: importAccountReducer,
  actions: importAccountActions,
} = createMonitoredSaga<ImportAccountParams>(importAccount, 'importAccount')

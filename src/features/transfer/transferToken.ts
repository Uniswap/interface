import { providers, utils } from 'ethers'
import { getWalletAccounts, getWalletProviders } from 'src/app/walletContext'
import { SupportedChainId } from 'src/constants/chains'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { TransferTokenParams } from 'src/features/transfer/types'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export function* transferToken(params: TransferTokenParams) {
  const { account, tokenAddress, amount, toAddress } = params
  const accountManager = yield* call(getWalletAccounts)
  const providerManager = yield* call(getWalletProviders)
  yield* call(
    _transferToken,
    account,
    tokenAddress,
    amount,
    toAddress,
    accountManager,
    providerManager
  )
}

async function _transferToken(
  account: AccountStub,
  tokenAddress: Address,
  amount: string,
  toAddress: Address,
  accountManager: AccountManager,
  providerManager: ProviderManager
) {
  // TODO use the appropriate provider for current chain
  const goerliProvider = providerManager.getProvider(SupportedChainId.GOERLI)
  const walletAccount = accountManager.getAccount(account.address, SupportedChainId.GOERLI)

  if (!walletAccount) throw Error('No active account')

  // TODO check balance?
  // TODO handle non ETH sending by checking tokenAddress
  const currentGasPrice = await goerliProvider.getGasPrice()
  const gasPrice = utils.hexlify(parseInt(currentGasPrice.toString(), 10))
  const nonce = await goerliProvider.getTransactionCount(account.address, 'pending')
  const transaction: providers.TransactionRequest = {
    from: account.address,
    to: toAddress,
    value: utils.parseEther(amount),
    nonce,
    gasPrice,
  }
  const gasLimit = await goerliProvider.estimateGas(transaction)
  transaction.gasLimit = gasLimit
  const signedTransaction = await walletAccount.signer.signTransaction(transaction)
  const transactionResult = await goerliProvider.sendTransaction(signedTransaction)
  logger.debug('Send finished!', transactionResult)
}

export const {
  name: transferTokenSagaName,
  wrappedSaga: transferTokenSaga,
  reducer: transferTokenReducer,
  actions: transferTokenActions,
} = createMonitoredSaga<TransferTokenParams>(transferToken, 'transferToken')

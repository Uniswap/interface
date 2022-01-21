import { providers, utils } from 'ethers'
import { getProviderManager, getSignerManager } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { TransferTokenParams } from 'src/features/transfer/types'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export function* transferToken(params: TransferTokenParams) {
  const { account, tokenAddress, amount, toAddress } = params
  const signerManager = yield* call(getSignerManager)
  const providerManager = yield* call(getProviderManager)
  yield* call(
    _transferToken,
    account,
    tokenAddress,
    amount,
    toAddress,
    signerManager,
    providerManager
  )
}

async function _transferToken(
  account: Account,
  tokenAddress: Address,
  amount: string,
  toAddress: Address,
  signerManager: SignerManager,
  providerManager: ProviderManager
) {
  // TODO use the appropriate provider for current chain
  const provider = providerManager.getProvider(ChainId.RINKEBY)
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)

  // TODO check balance?
  // TODO handle non ETH sending by checking tokenAddress
  const currentGasPrice = await provider.getGasPrice()
  const gasPrice = utils.hexlify(parseInt(currentGasPrice.toString(), 10))
  const nonce = await provider.getTransactionCount(account.address, 'pending')
  const transaction: providers.TransactionRequest = {
    from: account.address,
    to: toAddress,
    value: utils.parseEther(amount),
    nonce,
    gasPrice,
  }
  const gasLimit = await provider.estimateGas(transaction)
  transaction.gasLimit = gasLimit
  const signedTransaction = await connectedSigner.signTransaction(transaction)
  const transactionResult = await provider.sendTransaction(signedTransaction)
  logger.debug('transferToken', '', 'Send finished!', transactionResult)
}

export const {
  name: transferTokenSagaName,
  wrappedSaga: transferTokenSaga,
  reducer: transferTokenReducer,
  actions: transferTokenActions,
} = createMonitoredSaga<TransferTokenParams>(transferToken, 'transferToken')

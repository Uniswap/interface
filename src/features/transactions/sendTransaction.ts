import { providers } from 'ethers'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { transactionActions } from 'src/features/transactions/slice'
import {
  TransactionOptions,
  TransactionReceipt,
  TransactionStatus,
  TransactionTypeInfo,
} from 'src/features/transactions/types'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { call, put } from 'typed-redux-saga'

interface SendTransactionParams {
  chainId: ChainId
  account: Account
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here
export function* sendTransaction(params: SendTransactionParams) {
  const { account, chainId, options } = params
  logger.debug(
    'sendTransaction',
    '',
    `Sending tx on ${CHAIN_INFO[chainId].label} to ${options.request.to}`
  )

  if (account.type === AccountType.readonly) throw new Error('Account must support signing')

  // Sign and send the transaction
  const signerManager = yield* call(getSignerManager)
  const providerManager = yield* call(getWalletProviders)
  const txResponse = yield* call(signAndSendTransaction, params, signerManager, providerManager)
  logger.debug('sendTransaction', '', 'Tx submitted:', txResponse.hash)

  // Register the tx in the store
  yield* call(addTransaction, params, txResponse.hash)

  // Wait for the first confirmation/failure receipt for the tx
  // TODO move the actual sending to a new txManager saga
  const txReceipt = yield* call(txResponse.wait)
  logger.debug('sendTransaction', '', 'Tx receipt received for:', txReceipt.transactionHash)

  // Update the store with tx receipt details
  yield* call(finalizeTransaction, chainId, txReceipt)

  if (options.fetchBalanceOnSuccess) {
    yield* put(fetchBalancesActions.trigger(account.address))
  }
}

export async function signAndSendTransaction(
  { chainId, account, options }: SendTransactionParams,
  signerManager: SignerManager,
  providerManager: ProviderManager
) {
  const provider = providerManager.getProvider(chainId)
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const populatedTx = await connectedSigner.populateTransaction(options.request)
  const signedTx = await connectedSigner.signTransaction(populatedTx)
  const txResponse = await provider.sendTransaction(signedTx)
  return txResponse
}

function* addTransaction(params: SendTransactionParams, hash: string) {
  const { chainId, account, typeInfo, options } = params
  // prettier-ignore
  const { to, from, nonce, gasLimit, gasPrice, data, value, maxPriorityFeePerGas, maxFeePerGas, type } = options.request
  const transaction = {
    chainId,
    hash,
    typeInfo,
    from: account.address,
    options: {
      ...options,
      // Manually restructure the txParams to ensure values going into store are serializable
      request: {
        chainId,
        type,
        to,
        from,
        nonce: nonce ? parseInt(nonce.toString(), 10) : undefined,
        gasLimit: gasLimit?.toString(),
        gasPrice: gasPrice?.toString(),
        data: data?.toString(),
        value: value?.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
        maxFeePerGas: maxFeePerGas?.toString(),
      },
    },
  }
  yield* put(transactionActions.addTransaction(transaction))
}

function* finalizeTransaction(chainId: ChainId, ethersReceipt: providers.TransactionReceipt) {
  const hash = ethersReceipt.transactionHash
  const status = ethersReceipt.status ? TransactionStatus.Success : TransactionStatus.Failed
  const receipt: TransactionReceipt = {
    blockHash: ethersReceipt.blockHash,
    blockNumber: ethersReceipt.blockNumber,
    transactionIndex: ethersReceipt.transactionIndex,
    confirmations: ethersReceipt.confirmations,
    confirmedTime: Date.now(),
  }
  yield* put(
    transactionActions.finalizeTransaction({
      chainId,
      hash,
      status,
      receipt,
    })
  )
}

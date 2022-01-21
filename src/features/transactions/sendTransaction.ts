import { providers } from 'ethers'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { transactionActions } from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionOptions,
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
  const { chainId, account, options } = params

  logger.debug(
    'sendTransaction',
    '',
    `Sending tx on ${CHAIN_INFO[chainId].label} to ${options.request.to}`
  )

  if (account.type === AccountType.readonly) throw new Error('Account must support signing')
  // Sign and send the transaction
  const provider = yield* call(getProvider, chainId)
  const signerManager = yield* call(getSignerManager)
  const txResponse = yield* call(signAndSendTransaction, params, provider, signerManager)
  logger.debug('sendTransaction', '', 'Tx submitted:', txResponse.hash)

  // Register the tx in the store
  yield* call(addTransaction, params, txResponse.hash)
}

export async function signAndSendTransaction(
  { account, options }: SendTransactionParams,
  provider: providers.Provider,
  signerManager: SignerManager
) {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const populatedTx = await connectedSigner.populateTransaction(options.request)
  const signedTx = await connectedSigner.signTransaction(populatedTx)
  const txResponse = await provider.sendTransaction(signedTx)
  return txResponse
}

function* addTransaction(
  { chainId, typeInfo, account, options }: SendTransactionParams,
  hash: string
) {
  // prettier-ignore
  const { to, from, nonce, gasLimit, gasPrice, data, value, maxPriorityFeePerGas, maxFeePerGas, type } = options.request
  const transaction: TransactionDetails = {
    chainId,
    hash,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
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

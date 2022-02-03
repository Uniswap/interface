import { providers } from 'ethers'
import { appSelect } from 'src/app/hooks'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { logEvent } from 'src/features/telemetry'
import { EventName } from 'src/features/telemetry/constants'
import { transactionActions } from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionStatus,
  TransactionTypeInfo,
} from 'src/features/transactions/types'
import {
  getSerializableTransactionRequest,
  getTransactionCount,
} from 'src/features/transactions/utils'
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
  const request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${CHAIN_INFO[chainId].label} to ${request.to}`)

  if (account.type === AccountType.Readonly) throw new Error('Account must support signing')
  // Sign and send the transaction
  const provider = yield* call(getProvider, chainId)
  const signerManager = yield* call(getSignerManager)
  const { transactionResponse, populatedRequest } = yield* call(
    signAndSendTransaction,
    request,
    account,
    provider,
    signerManager
  )
  logger.debug('sendTransaction', '', 'Tx submitted:', transactionResponse.hash)

  // Register the tx in the store
  yield* call(addTransaction, params, transactionResponse.hash, populatedRequest)
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: Account,
  provider: providers.Provider,
  signerManager: SignerManager
) {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const populatedRequest = await connectedSigner.populateTransaction(request)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest }
}

function* addTransaction(
  { chainId, typeInfo, account, options }: SendTransactionParams,
  hash: string,
  populatedRequest: providers.TransactionRequest
) {
  const txsByChainId = yield* appSelect((state) => state.transactions.byChainId)
  const txCount = getTransactionCount(txsByChainId)
  const id = txCount.toString() // 0 indexed so count is actually next id
  const request = getSerializableTransactionRequest(populatedRequest, chainId)
  const transaction: TransactionDetails = {
    id,
    chainId,
    hash,
    typeInfo,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
      request,
    },
  }
  yield* put(transactionActions.addTransaction(transaction))
  yield* call(logEvent, EventName.Transaction, { chainId, ...typeInfo })
}

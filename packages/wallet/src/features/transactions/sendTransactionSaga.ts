import { providers } from 'ethers'
import { call, put } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { CHAIN_INFO, ChainId, RPCType } from 'wallet/src/constants/chains'
import { transactionActions } from 'wallet/src/features/transactions/slice'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'wallet/src/features/transactions/types'
import {
  createTransactionId,
  getSerializableTransactionRequest,
} from 'wallet/src/features/transactions/utils'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'
import { hexlifyTransaction } from 'wallet/src/utils/transaction'

export interface SendTransactionParams {
  // internal id used for tracking transactions before they're submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: ChainId
  account: Account
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  analytics?: ReturnType<typeof getBaseTradeAnalyticsProperties>
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here

export function* sendTransaction(params: SendTransactionParams) {
  const { chainId, account, options } = params
  const request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${CHAIN_INFO[chainId].label} to ${request.to}`)

  if (account.type === AccountType.Readonly) {
    throw new Error('Account must support signing')
  }

  // Sign and send the transaction
  const rpcType = options.submitViaPrivateRpc ? RPCType.Private : RPCType.Public
  const provider = yield* call(getProvider, chainId, rpcType)
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
  return { transactionResponse }
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: Account,
  provider: providers.Provider,
  signerManager: SignerManager
): Promise<{
  transactionResponse: providers.TransactionResponse
  populatedRequest: providers.TransactionRequest
}> {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest }
}

function* addTransaction(
  { chainId, typeInfo, account, options, txId, analytics }: SendTransactionParams,
  hash: string,
  populatedRequest: providers.TransactionRequest
) {
  const id = txId ?? createTransactionId()
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

  if (transaction.typeInfo.type === TransactionType.Swap) {
    if (!analytics) {
      logger.error(new Error('Missing `analytics` for swap when calling `addTransaction`'), {
        tags: { file: 'sendTransaction', function: 'addTransaction' },
        extra: { transaction },
      })
    } else {
      yield* call(sendWalletAnalyticsEvent, WalletEventName.SwapSubmitted, {
        transaction_hash: hash,
        ...analytics,
      })
    }
  }
  yield* put(transactionActions.addTransaction(transaction))
  logger.debug('sendTransaction', 'addTransaction', 'Tx added:', { chainId, ...typeInfo })
}

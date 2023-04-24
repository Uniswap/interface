import { Currency, TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { CallEffect, PutEffect } from 'redux-saga/effects'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { isFlashbotsSupportedChainId } from 'src/features/providers/flashbotsProvider'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { transactionActions } from 'src/features/transactions/slice'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { formatAsHexString } from 'src/features/transactions/swap/utils'
import {
  TransactionDetails,
  TransactionOptions,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'
import {
  createTransactionId,
  getSerializableTransactionRequest,
} from 'src/features/transactions/utils'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { selectFlashbotsEnabled } from 'src/features/wallet/selectors'
import { SignerManager } from 'src/features/wallet/signing/SignerManager'
import { getCurrencyAddressForAnalytics } from 'src/utils/currencyId'
import { formatCurrencyAmount, NumberType } from 'src/utils/format'
import { logger } from 'src/utils/logger'
import { call, put, select } from 'typed-redux-saga'

export interface SendTransactionParams {
  // internal id used for tracking transactions before theyre submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: ChainId
  account: Account
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  trade?: Trade<Currency, Currency, TradeType>
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here
// TODO(MOB-3857): Add more specific return type definition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function* sendTransaction(params: SendTransactionParams): Generator<any> {
  const { chainId, account, options } = params
  const request = options.request

  logger.debug('sendTransaction', '', `Sending tx on ${CHAIN_INFO[chainId].label} to ${request.to}`)

  if (account.type === AccountType.Readonly) throw new Error('Account must support signing')

  const isFlashbotsEnabled = yield* select(selectFlashbotsEnabled)
  const isFlashbots = isFlashbotsEnabled && isFlashbotsSupportedChainId(params.chainId)

  // Sign and send the transaction
  const provider = yield* call(getProvider, chainId, isFlashbots)

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
  yield* call(addTransaction, params, transactionResponse.hash, populatedRequest, isFlashbots)
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
  if (!signer) return Promise.reject(`No signer found for ${account}`)

  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest }
}

// hexlifyTransaction is idemnpotent so it's safe to call more than once on a singular transaction request
function hexlifyTransaction(
  transferTxRequest: providers.TransactionRequest
): providers.TransactionRequest {
  const { value, nonce, gasLimit, gasPrice, maxPriorityFeePerGas, maxFeePerGas } = transferTxRequest
  return {
    ...transferTxRequest,
    nonce: formatAsHexString(nonce),
    value: formatAsHexString(value),
    gasLimit: formatAsHexString(gasLimit),

    // only pass in for legacy chains
    ...(gasPrice ? { gasPrice: formatAsHexString(gasPrice) } : {}),

    // only pass in for eip1559 tx
    ...(maxPriorityFeePerGas
      ? {
          maxPriorityFeePerGas: formatAsHexString(maxPriorityFeePerGas),
          maxFeePerGas: formatAsHexString(maxFeePerGas),
        }
      : {}),
  }
}

function* addTransaction(
  { chainId, typeInfo, account, options, txId, trade }: SendTransactionParams,
  hash: string,
  populatedRequest: providers.TransactionRequest,
  isFlashbots?: boolean
): Generator<
  | CallEffect<never>
  | PutEffect<{
      payload: TransactionDetails
      type: string
    }>,
  void,
  unknown
> {
  const id = txId ?? createTransactionId()
  const request = getSerializableTransactionRequest(populatedRequest, chainId)

  const transaction: TransactionDetails = {
    id,
    chainId,
    hash,
    typeInfo,
    isFlashbots,
    from: account.address,
    addedTime: Date.now(),
    status: TransactionStatus.Pending,
    options: {
      ...options,
      request,
    },
  }

  if (transaction.typeInfo.type === TransactionType.Swap && trade) {
    yield* call(sendAnalyticsEvent, MobileEventName.SwapSubmitted, {
      transaction_hash: hash,
      chain_id: chainId,
      price_impact_basis_points: trade.priceImpact.multiply(100).toSignificant(),
      token_in_amount: trade.inputAmount.toExact(),
      token_out_amount: formatCurrencyAmount(trade.outputAmount, NumberType.SwapTradeAmount),
      token_in_symbol: trade.inputAmount.currency.symbol,
      token_in_address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
      token_out_symbol: trade.outputAmount.currency.symbol,
      token_out_address: getCurrencyAddressForAnalytics(trade.outputAmount.currency),
    })
  }
  yield* put(transactionActions.addTransaction(transaction))
  logger.debug('sendTransaction', 'addTransaction', 'Tx added:', { chainId, ...typeInfo })
}

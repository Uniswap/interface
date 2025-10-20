import { Currency } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { isBridge, isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  FinalizedTransactionStatus,
  TransactionDetails,
  TransactionNetworkFee,
  TransactionOptions,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { receiptFromEthersReceipt } from 'uniswap/src/features/transactions/utils/receipt'

export function getSerializableTransactionRequest(
  request: providers.TransactionRequest,
  chainId?: UniverseChainId,
): providers.TransactionRequest {
  const { to, from, nonce, gasLimit, data, gasPrice, value, maxPriorityFeePerGas, maxFeePerGas, type } = request
  // Manually restructure the txParams to ensure values going into store are serializable
  return {
    chainId,
    type,
    to,
    from,
    nonce: nonce ? BigNumber.from(nonce).toString() : undefined,
    gasLimit: gasLimit?.toString(),
    gasPrice: gasPrice?.toString(),
    data: data?.toString(),
    value: value?.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
    maxFeePerGas: maxFeePerGas?.toString(),
  }
}

export const ANIMATE_SPRING_CONFIG = {
  stiffness: 90,
  damping: 15,
  mass: 0.8,
}

// Based on the current status of the transaction, we determine the new status.
export function getFinalizedTransactionStatus(
  currentStatus: TransactionStatus,
  receiptStatus?: number,
): FinalizedTransactionStatus {
  if (!receiptStatus) {
    return TransactionStatus.Failed
  }
  if (currentStatus === TransactionStatus.Cancelling) {
    return TransactionStatus.Canceled
  }
  return TransactionStatus.Success
}

export function isAmountGreaterThanZero({
  exactAmountToken,
  exactAmountFiat,
  currency,
}: {
  exactAmountToken: string | undefined
  exactAmountFiat: string | undefined
  currency: Currency | undefined
}): boolean {
  if (exactAmountToken) {
    return (
      getCurrencyAmount({
        value: exactAmountToken,
        valueType: ValueType.Exact,
        currency,
      })?.greaterThan(0) || false
    )
  }
  if (exactAmountFiat) {
    return (
      getCurrencyAmount({
        value: exactAmountFiat,
        valueType: ValueType.Exact,
        currency,
      })?.greaterThan(0) || false
    )
  }
  return false
}

export function isOnRampTransaction(tx: TransactionDetails): boolean {
  return (
    tx.typeInfo.type === TransactionType.LocalOnRamp ||
    tx.typeInfo.type === TransactionType.OnRampPurchase ||
    tx.typeInfo.type === TransactionType.OnRampTransfer
  )
}

export function isOffRampTransaction(tx: TransactionDetails): boolean {
  return tx.typeInfo.type === TransactionType.LocalOffRamp || tx.typeInfo.type === TransactionType.OffRampSale
}

export function isFORTransaction(tx: TransactionDetails): boolean {
  return isOnRampTransaction(tx) || isOffRampTransaction(tx)
}

export function getDiff(value1: number | string | undefined, value2: number | undefined): number | undefined {
  if (typeof value1 === 'string') {
    value1 = Number(value1)
  }
  return value1 !== undefined && value2 !== undefined ? value1 - value2 : undefined
}

export function getOptionalTransactionProperty<T>(
  transaction: TransactionDetails,
  accessor: (options: TransactionOptions) => T,
): T | undefined {
  if ('options' in transaction) {
    return accessor(transaction.options)
  }
  return undefined
}

export function getPercentageError(
  diff: number | undefined,
  estimated: number | string | undefined,
): number | undefined {
  if (typeof estimated === 'string') {
    estimated = Number(estimated)
  }
  return diff !== undefined && estimated !== undefined && estimated !== 0 ? (diff / estimated) * 100 : undefined
}

/**
 * Parses the incoming error from an attempted RPC call and returns a
 * category. As more distinct patterns are found from the errors, we
 * should update this function to categorize them.
 */
export function getRPCErrorCategory(error: Error): string {
  const message = error.message
  switch (true) {
    case message.includes('nonce'):
    case message.includes('future transaction tries to replace pending'):
      return 'nonce_error'
    case message.includes('Failed in pending block with: Reverted'):
      return 'reverted'
    case message.includes('intrinsic gas too low'):
    case message.includes('max fee per gas less than block base fee'):
    case message.includes('transaction underpriced'):
    case message.includes('replacement fee too low'):
      return 'gas_too_low'
    case message.includes('overshot'):
    case message.includes('insufficient funds'):
      return 'insufficient_funds'
    case message.includes('Response status: 429'):
    case message.includes('Too Many Requests'):
      return 'rate_limited'
    case message.includes('already known'):
      return 'already_known'
    case message.includes('could not detect network'):
      return 'no_network'
    case message.includes('code=TIMEOUT'):
      return 'timeout'
    case message.includes('Cannot read properties of'):
    case message.includes('Cannot convert null value to object'):
    case message.includes('Invalid data value'):
      return 'invalid_data'
    case message.includes('in-flight transaction limit reached for delegated accounts'):
      return 'tx_limit_reached_for_delegated_account'
    case message.includes('status=502'):
      return 'bad_gateway'
    default:
      return 'unknown'
  }
}

export function buildNetworkFeeFromReceipt({
  receipt,
  nativeCurrency,
  chainId,
}: {
  receipt: providers.TransactionReceipt
  nativeCurrency: UniverseChainInfo['nativeCurrency']
  chainId: UniverseChainId
}): TransactionNetworkFee {
  return {
    quantity: formatEther(receipt.effectiveGasPrice.mul(receipt.gasUsed)),
    tokenSymbol: nativeCurrency.symbol,
    tokenAddress: nativeCurrency.address,
    chainId,
  }
}

/**
 * Processes a transaction receipt and creates updated transaction details with receipt, network fee, and status.
 */
export function processTransactionReceipt<T extends TransactionDetails>(params: {
  ethersReceipt: providers.TransactionReceipt
  transaction: T
}): T {
  const { ethersReceipt, transaction } = params

  const receipt = receiptFromEthersReceipt(ethersReceipt)
  const { nativeCurrency } = getChainInfo(transaction.chainId)

  const networkFee = buildNetworkFeeFromReceipt({
    receipt: ethersReceipt,
    nativeCurrency,
    chainId: transaction.chainId,
  })

  let status = transaction.status

  if (
    isBridge(transaction) &&
    getFinalizedTransactionStatus(transaction.status, ethersReceipt.status) === TransactionStatus.Success
  ) {
    if (!transaction.sendConfirmed) {
      // Only the send part was successful, transaction watcher will wait for receive part to be confirmed on chain before marking as finalized.
      // Bridge swaps become non-cancellable after the send transaction is confirmed on chain.
      return { ...transaction, sendConfirmed: true, networkFee }
    }
  } else if (isClassic(transaction)) {
    // Classic transaction status is based on receipt, while UniswapX status is based backend response and shouldn't be updated here
    status = getFinalizedTransactionStatus(transaction.status, ethersReceipt.status)
  }

  return { ...transaction, networkFee, status, receipt }
}

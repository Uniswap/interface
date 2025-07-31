import { Currency } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { isBridge, isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  FinalizedTransactionStatus,
  TransactionDetails,
  TransactionNetworkFee,
  TransactionOptions,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function getSerializableTransactionRequest(
  request: providers.TransactionRequest,
  chainId?: UniverseChainId,
): providers.TransactionRequest {
  // prettier-ignore
  const { to, from, nonce, gasLimit, gasPrice, data, value, maxPriorityFeePerGas, maxFeePerGas, type } = request
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

export function receiptFromEthersReceipt(
  ethersReceipt: providers.TransactionReceipt | undefined,
): TransactionReceipt | undefined {
  if (!ethersReceipt) {
    return undefined
  }

  return {
    blockHash: ethersReceipt.blockHash,
    blockNumber: ethersReceipt.blockNumber,
    transactionIndex: ethersReceipt.transactionIndex,
    confirmations: ethersReceipt.confirmations,
    confirmedTime: Date.now(),
    gasUsed: ethersReceipt.gasUsed.toNumber(),
    effectiveGasPrice: ethersReceipt.effectiveGasPrice.toNumber(),
  }
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
      return 'gas_too_low'
    case message.includes('insufficient funds for intrinsic transaction cost'):
      return 'insufficient_gas'
    case message.includes('Too Many Requests'):
      return 'rate_limited'
    case message.includes('already known'):
      return 'already_known'
    case message.includes('code=TIMEOUT'):
      return 'timeout'
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

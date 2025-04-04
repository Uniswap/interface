import { Currency } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { isBridge, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  FinalizedTransactionStatus,
  TransactionDetails,
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

export function getIsCancelable(tx: TransactionDetails): boolean {
  if (isBridge(tx) && tx.sendConfirmed) {
    return false
  }
  if (tx.status === TransactionStatus.Pending && (isUniswapX(tx) || Object.keys(tx.options?.request).length > 0)) {
    return true
  }
  return false
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
    gasUsed: ethersReceipt.gasUsed?.toNumber(),
    effectiveGasPrice: ethersReceipt.effectiveGasPrice?.toNumber(),
  }
}

export const isAmountGreaterThanZero = (
  exactAmountToken: string | undefined,
  exactAmountFiat: string | undefined,
  currency: Currency | undefined,
): boolean => {
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

export function getPercentageError(
  diff: number | undefined,
  estimated: number | string | undefined,
): number | undefined {
  if (typeof estimated === 'string') {
    estimated = Number(estimated)
  }
  return diff !== undefined && estimated !== undefined && estimated !== 0 ? (diff / estimated) * 100 : undefined
}

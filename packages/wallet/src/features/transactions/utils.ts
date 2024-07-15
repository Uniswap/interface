import { NetInfoState } from '@react-native-community/netinfo'
import { CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers'
import { WalletChainId } from 'uniswap/src/types/chains'
import { v4 as uuid } from 'uuid'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import {
  FinalizedTransactionStatus,
  TransactionDetails,
  TransactionReceipt,
  TransactionStatus,
} from 'wallet/src/features/transactions/types'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export const MAX_FIAT_INPUT_DECIMALS = 2

export function getSerializableTransactionRequest(
  request: providers.TransactionRequest,
  chainId?: WalletChainId,
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

function getNativeCurrencyTotalSpend(
  value?: CurrencyAmount<NativeCurrency>,
  gasFee?: string,
  nativeCurrency?: NativeCurrency,
): Maybe<CurrencyAmount<NativeCurrency>> {
  if (!gasFee || !nativeCurrency) {
    return value
  }

  const gasFeeAmount = getCurrencyAmount({
    value: gasFee,
    valueType: ValueType.Raw,
    currency: nativeCurrency,
  })

  return value && gasFeeAmount ? gasFeeAmount.add(value) : gasFeeAmount
}

export function hasSufficientFundsIncludingGas(params: {
  transactionAmount?: CurrencyAmount<NativeCurrency>
  gasFee?: string
  nativeCurrencyBalance?: CurrencyAmount<NativeCurrency>
}): boolean {
  const { transactionAmount, gasFee, nativeCurrencyBalance } = params
  const totalSpend = getNativeCurrencyTotalSpend(transactionAmount, gasFee, nativeCurrencyBalance?.currency)
  return !totalSpend || !nativeCurrencyBalance?.lessThan(totalSpend)
}

export function createTransactionId(): string {
  return uuid()
}

export const ANIMATE_SPRING_CONFIG = {
  stiffness: 90,
  damping: 15,
  mass: 0.8,
}

export function isOffline(networkStatus: NetInfoState): boolean {
  return (
    networkStatus.type !== 'unknown' &&
    typeof networkStatus.isInternetReachable === 'boolean' &&
    networkStatus.isConnected === false
  )
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

import { CurrencyAmount, NativeCurrency, TradeType } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers'
import { ChainId } from 'src/constants/chains'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'src/features/transactions/types'
import { v4 as uuid } from 'uuid'

export function getSerializableTransactionRequest(
  request: providers.TransactionRequest,
  chainId?: ChainId
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
  nativeCurrency?: NativeCurrency
): NullUndefined<CurrencyAmount<NativeCurrency>> {
  if (!gasFee || !nativeCurrency) return value

  const gasFeeAmount = CurrencyAmount.fromRawAmount(nativeCurrency, gasFee)
  return value ? gasFeeAmount.add(value) : gasFeeAmount
}

export function hasSufficientFundsIncludingGas(params: {
  transactionAmount?: CurrencyAmount<NativeCurrency>
  gasFee?: string
  nativeCurrencyBalance?: CurrencyAmount<NativeCurrency>
}): boolean {
  const { transactionAmount, gasFee, nativeCurrencyBalance } = params
  const totalSpend = getNativeCurrencyTotalSpend(
    transactionAmount,
    gasFee,
    nativeCurrencyBalance?.currency
  )
  return !totalSpend || !nativeCurrencyBalance?.lessThan(totalSpend)
}

export function createTransactionId(): string {
  return uuid()
}

export function getInputAmountFromTrade(
  typeInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
): string {
  return typeInfo.tradeType === TradeType.EXACT_INPUT
    ? typeInfo.inputCurrencyAmountRaw
    : typeInfo.expectedInputCurrencyAmountRaw
}

export function getOutputAmountFromTrade(
  typeInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
): string {
  return typeInfo.tradeType === TradeType.EXACT_OUTPUT
    ? typeInfo.outputCurrencyAmountRaw
    : typeInfo.expectedOutputCurrencyAmountRaw
}

export const ANIMATE_SPRING_CONFIG = {
  stiffness: 90,
  damping: 15,
  mass: 0.8,
}

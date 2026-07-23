import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { type ChainedQuoteResponse, TradingApi } from '@universe/api'
import type { ExecuteEarnDepositParams } from 'uniswap/src/features/earn/DepositReviewView'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { isChainedQuoteResponse } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getTokenAddressForApi } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { NumberType } from 'utilities/src/format/types'

type ExecuteEarnDeposit = (params: ExecuteEarnDepositParams) => void

export interface PreparedDepositExecutionParams {
  currency: Currency
  earnIntent: TradingApi.EarnIntent
  inputCurrencyAmount: CurrencyAmount<Currency>
  onExecuteDeposit: ExecuteEarnDeposit
  quote: ChainedQuoteResponse
  vaultShareCurrency: Currency
}

export function getPreparedDepositExecutionParams({
  currency,
  earnIntent,
  inputCurrencyAmount,
  onExecuteDeposit,
  quote,
  vaultShareCurrency,
}: {
  currency: Currency | undefined
  earnIntent: TradingApi.EarnIntent | undefined
  inputCurrencyAmount: CurrencyAmount<Currency> | undefined
  onExecuteDeposit: ExecuteEarnDeposit | undefined
  quote: TradingApi.QuoteResponse | undefined
  vaultShareCurrency: Currency | undefined
}): PreparedDepositExecutionParams | undefined {
  if (
    !currency ||
    !earnIntent ||
    !inputCurrencyAmount ||
    !onExecuteDeposit ||
    !quote ||
    !isChainedQuoteResponse(quote) ||
    !vaultShareCurrency
  ) {
    return undefined
  }

  return { currency, earnIntent, inputCurrencyAmount, onExecuteDeposit, quote, vaultShareCurrency }
}

export function getDepositTokenAmountLabel({
  formatNumberOrString,
  tokenAmountValue,
}: {
  formatNumberOrString: (input: { value: string; type: NumberType }) => string
  tokenAmountValue: string | null
}): string {
  if (tokenAmountValue === null) {
    return '—'
  }

  return formatNumberOrString({
    value: tokenAmountValue,
    type: NumberType.TokenNonTx,
  })
}

export function getDepositInputCurrencyAmount({
  currency,
  tokenAmountValue,
}: {
  currency: Currency | undefined
  tokenAmountValue: string | null
}): CurrencyAmount<Currency> | undefined {
  if (tokenAmountValue === null) {
    return undefined
  }

  return (
    getCurrencyAmount({
      value: tokenAmountValue,
      valueType: ValueType.Exact,
      currency,
    }) ?? undefined
  )
}

export function getDepositQuoteRequestBase({
  accountAddress,
  currency,
  inputCurrencyAmount,
  quoteSourceTradingApiChainId,
  vault,
  vaultTradingApiChainId,
}: {
  accountAddress: string | undefined
  currency: Currency | undefined
  inputCurrencyAmount: CurrencyAmount<Currency> | undefined
  quoteSourceTradingApiChainId: TradingApi.ChainId | undefined
  vault: EarnVaultInfo
  vaultTradingApiChainId: TradingApi.ChainId | undefined
}): TradingApi.QuoteRequest | undefined {
  const tokenIn = getTokenAddressForApi(currency)
  if (
    !accountAddress ||
    !currency ||
    !inputCurrencyAmount ||
    !tokenIn ||
    !quoteSourceTradingApiChainId ||
    !vaultTradingApiChainId
  ) {
    return undefined
  }

  return {
    type: TradingApi.TradeType.EXACT_INPUT,
    amount: inputCurrencyAmount.quotient.toString(),
    tokenIn,
    tokenOut: vault.vaultAddress,
    tokenInChainId: quoteSourceTradingApiChainId,
    tokenOutChainId: vaultTradingApiChainId,
    swapper: accountAddress,
    recipient: accountAddress,
    routingPreference: TradingApi.RoutingPreference.BEST_PRICE,
  }
}

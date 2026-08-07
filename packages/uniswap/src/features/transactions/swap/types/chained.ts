import { ZERO_PERCENT } from '@uniswap/router-sdk'
import type { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { TradeType } from '@uniswap/sdk-core'
import type { ChainedQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { getPlanCompoundSlippageTolerance } from 'uniswap/src/features/transactions/swap/plan/slippage'
import {
  type BaseTrade,
  type BaseTradeAmounts,
  createBaseTradeAmounts,
  getQuotePriceDifference,
} from 'uniswap/src/features/transactions/swap/types/base'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'

const EARN_DEPOSIT_ACTION = 'deposit'
const EARN_DEPOSIT_PREVIEW_TYPE = 'DEPOSIT'
const NATIVE_ASSET_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
] as const

export type ChainedActionEarnIntent = TradingApi.EarnIntent | TradingApi.EarnQuoteIntent

export type ChainedActionTrade = BaseTrade<ChainedQuoteResponse, TradingApi.Routing.CHAINED> & {
  readonly indicative: false
  readonly tradeType: TradeType.EXACT_INPUT
  readonly swapFee: undefined
  readonly earnIntent: ChainedActionEarnIntent | undefined
  readonly inputTax: Percent
  readonly outputTax: Percent
  readonly slippageTolerance: number
  readonly deadline: undefined
}

export function createChainedActionTrade({
  quote,
  currencyIn,
  currencyOut,
  earnIntent,
  displayAmountsOverride,
}: {
  quote: ChainedQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  earnIntent?: ChainedActionEarnIntent
  // Normal chained actions display quote input/output. Earn display amounts may come from earnPreview.
  displayAmountsOverride?: BaseTradeAmounts
}): ChainedActionTrade | null {
  const resolvedEarnIntent = earnIntent ?? quote.quote.earnIntent
  const amounts = displayAmountsOverride ?? createBaseTradeAmounts({ quote, currencyIn, currencyOut })

  if (!amounts) {
    return null
  }

  const slippageTolerance =
    getPlanCompoundSlippageTolerance(quote.quote.steps) ?? quote.quote.slippage ?? quote.quote.slippageTolerance ?? 0

  return {
    ...amounts,
    quote,
    routing: TradingApi.Routing.CHAINED,
    tradeType: TradeType.EXACT_INPUT,
    swapFee: undefined,
    earnIntent: resolvedEarnIntent,
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    slippageTolerance,
    priceDifference: getChainedActionPriceDifference({
      quote,
      earnIntent: resolvedEarnIntent,
      outputAmount: amounts.outputAmount,
    }),
    deadline: undefined,
    quoteOutputAmount: amounts.outputAmount,
    quoteOutputAmountUserWillReceive: amounts.outputAmount,
    indicative: false,
  }
}

// Earn deposits can output vault shares; only surface a price difference when the display output is
// the underlying deposit asset, since comparing input value against vault shares is meaningless.
function getChainedActionPriceDifference({
  quote,
  earnIntent,
  outputAmount,
}: {
  quote: ChainedQuoteResponse
  earnIntent: ChainedActionEarnIntent | undefined
  outputAmount: CurrencyAmount<Currency>
}): Percent | undefined {
  const isEarnDeposit = (earnIntent?.action as string | undefined) === EARN_DEPOSIT_ACTION
  if (isEarnDeposit && !isEarnDepositOutputSafe({ quote, outputAmount })) {
    return undefined
  }
  return getQuotePriceDifference(quote)
}

function isEarnDepositOutputSafe({
  quote,
  outputAmount,
}: {
  quote: ChainedQuoteResponse
  outputAmount: CurrencyAmount<Currency>
}): boolean {
  const earnPreview = quote.quote.earnPreview
  if (earnPreview?.type !== EARN_DEPOSIT_PREVIEW_TYPE) {
    return false
  }

  const depositAsset = earnPreview.depositAssets[0]
  const outputCurrency = outputAmount.currency

  if (
    !depositAsset?.token ||
    !depositAsset.amount ||
    Number(depositAsset.chainId) !== outputCurrency.chainId ||
    outputAmount.quotient.toString() !== depositAsset.amount
  ) {
    return false
  }

  if (outputCurrency.isNative) {
    return NATIVE_ASSET_ADDRESSES.some((nativeAddress) => areEvmAddressesEqual(nativeAddress, depositAsset.token))
  }

  return areEvmAddressesEqual(outputCurrency.address, depositAsset.token)
}

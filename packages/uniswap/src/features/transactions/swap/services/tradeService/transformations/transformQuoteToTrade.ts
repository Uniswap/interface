import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'
import { QuoteCurrencyData } from 'uniswap/src/features/transactions/swap/hooks/useTrade/parseQuoteCurrencies'
import { getGasEstimate } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/estimateGas'
import {
  transformTradingApiResponseToTrade,
  validateTrade,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { CurrencyField } from 'uniswap/src/types/currency'
import { inXMinutesUnix } from 'utilities/src/time/time'

const DEFAULT_SWAP_VALIDITY_TIME_MINS = 30

export type QuoteWithTradeAndGasEstimate =
  | (DiscriminatedQuoteResponse & {
      gasEstimate: GasEstimate | undefined
      trade: NonNullable<ReturnType<typeof validateTrade>> | null
    })
  | null

export function transformQuoteToTrade(input: {
  quote: DiscriminatedQuoteResponse | null
  amountSpecified: Maybe<CurrencyAmount<Currency>>
  quoteCurrencyData: QuoteCurrencyData
}): QuoteWithTradeAndGasEstimate {
  if (!input.quote) {
    return null
  }

  const quoteCurrencyData = input.quoteCurrencyData
  const { currencyIn, currencyOut, requestTradeType } = quoteCurrencyData
  const exactCurrencyField = requestTradeType === TradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT
  const gasEstimate = getGasEstimate(input.quote)

  const formattedTrade =
    currencyIn && currencyOut
      ? transformTradingApiResponseToTrade({
          currencyIn,
          currencyOut,
          tradeType: requestTradeType,
          deadline: inXMinutesUnix(DEFAULT_SWAP_VALIDITY_TIME_MINS), // TODO(MOB-3050): set deadline as `quoteRequestArgs.deadline`
          data: input.quote,
        })
      : null

  const trade = formattedTrade
    ? validateTrade({
        trade: formattedTrade,
        currencyIn,
        currencyOut,
        exactAmount: input.amountSpecified,
        exactCurrencyField,
      })
    : null

  return {
    ...input.quote,
    gasEstimate,
    trade,
  }
}

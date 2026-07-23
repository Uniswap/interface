import { CurrencyAmount, type Currency } from '@uniswap/sdk-core'
import type {
  ClassicQuoteResponse,
  DutchQuoteResponse,
  DutchV3QuoteResponse,
  PriorityQuoteResponse,
} from '@universe/api'

type QuoteResponseWithAggregatedOutputs =
  | ClassicQuoteResponse
  | DutchQuoteResponse
  | DutchV3QuoteResponse
  | PriorityQuoteResponse

/**
 * Calculates the total output amount from a quote by summing all aggregated outputs.
 */
export function getQuoteOutputAmount<T extends QuoteResponseWithAggregatedOutputs>(
  quote: T | undefined,
  outputCurrency: Currency,
): CurrencyAmount<Currency> {
  if (!quote) {
    return CurrencyAmount.fromRawAmount(outputCurrency, '0')
  }

  return (
    quote.quote.aggregatedOutputs?.reduce(
      (acc, output) => acc.add(CurrencyAmount.fromRawAmount(outputCurrency, output.amount ?? '0')),
      CurrencyAmount.fromRawAmount(outputCurrency, '0'),
    ) ?? CurrencyAmount.fromRawAmount(outputCurrency, '0')
  )
}

/**
 * Calculates the minimum output amount that the swapper recipient will receive from a quote.
 */
export function getQuoteOutputAmountUserWillReceive<T extends QuoteResponseWithAggregatedOutputs>({
  quote,
  outputCurrency,
  recipient,
}: {
  quote?: T
  outputCurrency: Currency
  recipient?: string
}): CurrencyAmount<Currency> {
  if (!quote || !recipient) {
    return CurrencyAmount.fromRawAmount(outputCurrency, '0')
  }

  const output = quote.quote.aggregatedOutputs?.find((out) => out.recipient === recipient)
  return output
    ? CurrencyAmount.fromRawAmount(outputCurrency, output.minAmount ?? '0')
    : CurrencyAmount.fromRawAmount(outputCurrency, '0')
}

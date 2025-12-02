import { GetQuoteRequestResult } from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import { canonicalStringify } from 'utilities/src/format/canonicalJson'

/**
 * For the given QuoteRequestResult, return an ID which can be
 * used to compare whether the user's quote request args has changed.
 */
export function getIdentifierForQuote(input?: GetQuoteRequestResult): string {
  return canonicalStringify(input)
}

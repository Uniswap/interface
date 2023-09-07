import { BigintIsh, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'
import { formatCurrencyAmount } from 'utilities/src/format/format'
import { logger } from 'utilities/src/logger/logger'
import { getValidAddress, shortenAddress } from 'wallet/src/utils/addresses'

export function getFormattedCurrencyAmount(
  currency: Maybe<Currency>,
  currencyAmountRaw: string,
  isApproximateAmount = false
): string {
  if (!currency) return ''

  try {
    // Convert scientific notation into number format so it can be parsed by BigInt properly
    const parsedCurrencyAmountRaw: string | BigintIsh =
      convertScientificNotationToNumber(currencyAmountRaw)

    const currencyAmount = CurrencyAmount.fromRawAmount<Currency>(currency, parsedCurrencyAmountRaw)
    const formattedAmount = formatCurrencyAmount(currencyAmount)
    return isApproximateAmount ? `~${formattedAmount} ` : `${formattedAmount} `
  } catch (error) {
    logger.error('Could not format currency amount', {
      tags: {
        file: 'wallet/src/utils/currency',
        function: 'getFormattedCurrencyAmount',
        error: JSON.stringify(error),
      },
    })
    return ''
  }
}

export function getCurrencyDisplayText(
  currency: Maybe<Currency>,
  tokenAddressString: Address | undefined
): string | undefined {
  const symbolDisplayText = getSymbolDisplayText(currency?.symbol)

  if (symbolDisplayText) {
    return symbolDisplayText
  }

  return tokenAddressString && getValidAddress(tokenAddressString, true)
    ? shortenAddress(tokenAddressString)
    : tokenAddressString
}

const DEFAULT_MAX_SYMBOL_CHARACTERS = 6

export function getSymbolDisplayText(symbol: Maybe<string>): Maybe<string> {
  if (!symbol) {
    return symbol
  }

  return symbol.length > DEFAULT_MAX_SYMBOL_CHARACTERS
    ? symbol?.substring(0, DEFAULT_MAX_SYMBOL_CHARACTERS - 3) + '...'
    : symbol
}

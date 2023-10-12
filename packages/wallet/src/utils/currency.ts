import { BigintIsh, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'
import { formatCurrencyAmount } from 'utilities/src/format/format'
import { logger } from 'utilities/src/logger/logger'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  Currency as ServerCurrency,
  useConvertQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
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
    logger.error(error, {
      tags: { file: 'wallet/src/utils/currency', function: 'getFormattedCurrencyAmount' },
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

// TODO gary need to reconcile this enum with a central list of selectable currencies later
export type SupportedCurrency = Extract<
  ServerCurrency,
  | ServerCurrency.Aud
  | ServerCurrency.Brl
  | ServerCurrency.Cad
  | ServerCurrency.Eur
  | ServerCurrency.Gbp
  | ServerCurrency.Hkd
  | ServerCurrency.Idr
  | ServerCurrency.Inr
  | ServerCurrency.Jpy
  | ServerCurrency.Ngn
  | ServerCurrency.Pkr
  | ServerCurrency.Rub
  | ServerCurrency.Sgd
  | ServerCurrency.Thb
  | ServerCurrency.Try
  | ServerCurrency.Uah
  | ServerCurrency.Usd
  | ServerCurrency.Vnd
>

const SOURCE_CURRENCY = ServerCurrency.Usd // Assuming that all incoming values in the app are in USD

export function useFiatCurrencyConversion(
  fromAmount = 0,
  toCurrency: SupportedCurrency = ServerCurrency.Eur // TODO gary placeholder until in app currency selection
): { amount: number; currency: ServerCurrency } {
  const featureEnabled = useFeatureFlag(FEATURE_FLAGS.CurrencyConversion)

  const { data: latestConversion, previousData: prevConversion } = useConvertQuery({
    variables: { fromCurrency: SOURCE_CURRENCY, toCurrency },
    pollInterval: PollingInterval.Slow,
  })

  const conversion = latestConversion || prevConversion
  const conversionRate = conversion?.convert?.value
  const conversionCurrency = conversion?.convert?.currency

  const defaultResult = { amount: fromAmount, currency: SOURCE_CURRENCY }

  if (!featureEnabled || SOURCE_CURRENCY === toCurrency || !conversionRate || !conversionCurrency) {
    return defaultResult
  }

  return { amount: fromAmount * conversionRate, currency: conversionCurrency }
}

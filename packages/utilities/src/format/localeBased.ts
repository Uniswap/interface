import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import {
  FormatterRule,
  StandardCurrency,
  TYPE_TO_FORMATTER_RULES,
  TwoDecimalsCurrency,
} from 'utilities/src/format/localeBasedFormats'
import { NumberType } from 'utilities/src/format/types'

function getFormatterRule(input: number, type: NumberType): FormatterRule {
  const rules = TYPE_TO_FORMATTER_RULES[type]
  for (const rule of rules) {
    if (
      (rule.exact !== undefined && input === rule.exact) ||
      (rule.upperBound !== undefined && input < rule.upperBound)
    ) {
      return rule
    }
  }

  throw new Error(`formatter for type ${type} not configured correctly`)
}

export function formatNumber({
  input,
  locale,
  currencyCode = 'USD',
  type = NumberType.TokenNonTx,
  placeholder = '-',
}: {
  input: number | null | undefined
  locale: string
  currencyCode?: string
  type?: NumberType
  placeholder?: string
}): string {
  if (input === null || input === undefined) {
    return placeholder
  }

  const { formatter, overrideValue, postFormatModifier } = getFormatterRule(input, type)
  if (typeof formatter === 'string') {
    return formatter
  }

  const createdFormat = formatter.createFormat(locale, currencyCode)
  const formatted = createdFormat.format(overrideValue !== undefined ? overrideValue : input)
  return postFormatModifier ? postFormatModifier(formatted) : formatted
}

export function formatCurrencyAmount({
  amount,
  locale,
  type = NumberType.TokenNonTx,
  placeholder,
}: {
  amount?: CurrencyAmount<Currency> | null | undefined
  locale: string
  type?: NumberType
  placeholder?: string
}): string {
  return formatNumber({
    input: amount ? parseFloat(amount.toFixed()) : undefined,
    locale,
    type,
    placeholder,
  })
}

export function formatNumberOrString({
  price,
  locale,
  currencyCode,
  type,
  placeholder = '-',
}: {
  price: Maybe<number | string>
  locale: string
  currencyCode?: string
  type: NumberType
  placeholder?: string
}): string {
  if (price === null || price === undefined) {
    return placeholder
  }
  if (typeof price === 'string') {
    return formatNumber({ input: parseFloat(price), locale, currencyCode, type, placeholder })
  }
  return formatNumber({ input: price, locale, currencyCode, type, placeholder })
}

export function formatPercent(rawPercentage: Maybe<number | string>, locale: string): string {
  if (rawPercentage === null || rawPercentage === undefined) {
    return '-'
  }
  const percentage =
    typeof rawPercentage === 'string'
      ? parseFloat(rawPercentage)
      : parseFloat(rawPercentage.toString())
  return formatNumber({ input: percentage / 100, type: NumberType.Percentage, locale })
}

export function addFiatSymbolToNumber({
  value,
  locale,
  currencyCode,
  currencySymbol,
}: {
  value: Maybe<number | string>
  locale: string
  currencyCode: string
  currencySymbol: string
}): string {
  const format = StandardCurrency.createFormat(locale, currencyCode)
  const parts = format.formatToParts(0)
  const isSymbolAtFront = parts[0]?.type === 'currency'
  const extra = isSymbolAtFront // Some locales have something like an extra space after symbol
    ? parts[1]?.type === 'literal'
      ? parts[1]?.value
      : ''
    : parts[parts.length - 2]?.type === 'literal'
    ? parts[parts.length - 2]?.value
    : ''

  return isSymbolAtFront ? `${currencySymbol}${extra}${value}` : `${value}${extra}${currencySymbol}`
}

export type FiatCurrencyComponents = {
  groupingSeparator: string
  decimalSeparator: string
  symbol: string
  fullSymbol: string // Some currencies have whitespace in between number and currency
  symbolAtFront: boolean // All currencies are at front or back except CVE, which we won't ever support
}
/**
 * Helper function to return components of a currency value for a specific locale
 * E.g. comma, period, or space for separating thousands
 */
export function getFiatCurrencyComponents(
  locale: string,
  currencyCode: string
): FiatCurrencyComponents {
  const format = TwoDecimalsCurrency.createFormat(locale, currencyCode)

  // See MDN for official docs https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts
  // Returns something like [{"type":"currency","value":"$"},{"type":"integer","value":"1"}]
  const parts = format.formatToParts(1000000.0) // This number should provide both types of separators
  let groupingSeparator = ','
  let decimalSeparator = '.'
  let symbol = ''
  let fullSymbol = ''
  let symbolAtFront = true

  parts.forEach((part, index) => {
    if (part.type === 'group') {
      groupingSeparator = part.value
    } else if (part.type === 'decimal') {
      decimalSeparator = part.value
    } else if (part.type === 'currency') {
      symbol = part.value
      fullSymbol = symbol

      symbolAtFront = index === 0
      const nextPart = symbolAtFront ? parts[index + 1] : parts[index - 1]
      // Check for additional characters between symbol and number, like whitespace
      if (nextPart?.type === 'literal') {
        fullSymbol = symbolAtFront ? symbol + nextPart.value : nextPart.value + symbol
      }
    }
  })

  return {
    groupingSeparator,
    decimalSeparator,
    symbol,
    fullSymbol,
    symbolAtFront,
  }
}

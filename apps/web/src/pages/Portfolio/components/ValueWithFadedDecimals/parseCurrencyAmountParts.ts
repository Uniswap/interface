import { useMemo } from 'react'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'

interface ParsedCurrencyAmountParts {
  prefixSymbol: string
  wholeNumber: string
  decimalNumber: string | undefined
  suffixSymbol: string
  suffix: string | undefined
  decimalSeparator: string
}

export function parseCurrencyAmountParts({
  value,
  fullSymbol,
  symbolAtFront,
  decimalSeparator,
}: {
  value: string
  fullSymbol: string
  symbolAtFront: boolean
  decimalSeparator: string
}): ParsedCurrencyAmountParts {
  // Separate currency symbol from the numeric portion
  let numericPortion = value
  let prefixSymbol = ''
  let suffixSymbol = ''

  if (symbolAtFront && value.startsWith(fullSymbol)) {
    prefixSymbol = fullSymbol
    numericPortion = value.slice(fullSymbol.length)
  } else if (!symbolAtFront && value.endsWith(fullSymbol)) {
    suffixSymbol = fullSymbol
    numericPortion = value.slice(0, value.length - fullSymbol.length)
  }

  // Split the numeric portion into whole and decimal parts
  const decimalSeparatorIndex = numericPortion.indexOf(decimalSeparator)
  const wholeNumber = decimalSeparatorIndex === -1 ? numericPortion : numericPortion.slice(0, decimalSeparatorIndex)
  const decimalDigits = decimalSeparatorIndex === -1 ? '' : numericPortion.slice(decimalSeparatorIndex + 1)

  // Parse decimal digits to separate faded fraction from suffix
  const decimalMatch = decimalDigits ? decimalDigits.match(/^(\d+)(.*)$/) : null
  const decimalNumber = decimalMatch ? decimalMatch[1] : ''
  const suffix = decimalMatch ? decimalMatch[2] : ''

  return {
    prefixSymbol,
    wholeNumber: wholeNumber || '',
    decimalNumber,
    decimalSeparator,
    suffixSymbol,
    suffix,
  }
}

export function useParseCurrencyAmountParts(value: string): ParsedCurrencyAmountParts {
  // Use current locale's decimal separator (e.g., "," for many EU locales)
  const { fullSymbol, symbolAtFront, decimalSeparator } = useAppFiatCurrencyInfo()

  return useMemo(() => {
    return parseCurrencyAmountParts({ value, fullSymbol, symbolAtFront, decimalSeparator })
  }, [value, fullSymbol, symbolAtFront, decimalSeparator])
}

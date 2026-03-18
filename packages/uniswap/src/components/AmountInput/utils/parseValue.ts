import { replaceSeparators } from 'uniswap/src/components/AmountInput/utils/replaceSeparators'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { isMobileWeb } from 'utilities/src/platform'

export function parseValue({
  value,
  decimalSeparator,
  groupingSeparator,
  showSoftInputOnFocus,
  nativeKeyboardDecimalSeparator,
  maxDecimals,
}: {
  value?: string
  decimalSeparator: string
  groupingSeparator: string
  showSoftInputOnFocus?: boolean
  nativeKeyboardDecimalSeparator: string
  maxDecimals?: number
}): string {
  let parsedValue = value?.trim() ?? ''

  // Replace all non-numeric characters, leaving the decimal and thousand separators.
  parsedValue = parsedValue.replace(/[^0-9.,]/g, '')

  if (isMobileWeb) {
    // Override decimal handling in mweb since 'react-native-localize' provides unreliable native decimal separators in this specific env.
    // This isn't an ideal long-term solution (as it limits copy/paste flexibility), but it's necessary
    // to unblock users in various locales who are currently unable to input amounts correctly.
    parsedValue = parsedValue.replace(/,/g, '.')
  } else {
    // TODO(MOB-2385): replace this temporary solution for native keyboard.
    if (showSoftInputOnFocus && nativeKeyboardDecimalSeparator !== decimalSeparator) {
      parsedValue = replaceSeparators({
        value: parsedValue,
        decimalSeparator: nativeKeyboardDecimalSeparator,
        decimalOverride: decimalSeparator,
      })
    }

    parsedValue = replaceSeparators({
      value: parsedValue,
      groupingSeparator,
      decimalSeparator,
      groupingOverride: '',
      decimalOverride: '.',
    })
  }

  if (maxDecimals === undefined) {
    return parsedValue
  }

  return truncateToMaxDecimals({
    value: parsedValue,
    maxDecimals,
  })
}

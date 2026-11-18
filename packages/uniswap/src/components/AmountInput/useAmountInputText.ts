import { useCallback, useEffect } from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { numericInputEnforcer } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { parseValue } from 'uniswap/src/components/AmountInput/utils/parseValue'
import { replaceSeparators } from 'uniswap/src/components/AmountInput/utils/replaceSeparators'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { useOnMobileAppState } from 'utilities/src/device/appState'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { noop } from 'utilities/src/react/noop'

/**
 * The text handling of AmountInput, for hosts that render their own amount field: shows `value`
 * with the locale separators, parses typed text back (separators, decimal cap), clears a
 * non-numeric `value`, and keeps the soft keyboard down when the app returns to the foreground.
 *
 * `isFieldMounted` false pauses the clearing and the keyboard handling, for a host whose field
 * is not on screen yet (the currency panel without a token).
 */
export function useAmountInputText({
  value,
  onChangeText,
  showSoftInputOnFocus,
  maxDecimals,
  fiatCurrencyInfo,
  inputEnforcer = numericInputEnforcer,
  isFieldMounted = true,
}: {
  value?: string
  onChangeText?: (text: string) => void
  showSoftInputOnFocus?: boolean
  maxDecimals?: number
  fiatCurrencyInfo?: FiatCurrencyInfo
  inputEnforcer?: (value?: string) => boolean
  isFieldMounted?: boolean
}): { formattedValue: string; onChangeFormattedText: (text: string) => void } {
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const targetFiatCurrencyInfo = fiatCurrencyInfo || appFiatCurrencyInfo
  const { groupingSeparator, decimalSeparator } = targetFiatCurrencyInfo
  const { decimalSeparator: nativeKeyboardDecimalSeparator } = getNumberFormatSettings()

  useEffect(() => {
    // Resets input if non-numeric value is passed
    if (isFieldMounted && !inputEnforcer(value)) {
      onChangeText?.('')
    }
  }, [inputEnforcer, isFieldMounted, onChangeText, value])

  const onChangeFormattedText = useCallback(
    (val: string) => {
      onChangeText?.(
        parseValue({
          value: val,
          decimalSeparator,
          groupingSeparator,
          showSoftInputOnFocus,
          nativeKeyboardDecimalSeparator,
          maxDecimals,
        }),
      )
    },
    [
      decimalSeparator,
      groupingSeparator,
      maxDecimals,
      nativeKeyboardDecimalSeparator,
      onChangeText,
      showSoftInputOnFocus,
    ],
  )

  const formattedValue = replaceSeparators({
    value: value ?? '',
    groupingSeparator: ',',
    decimalSeparator: '.',
    groupingOverride: '',
    decimalOverride: decimalSeparator,
  })

  // Dismiss keyboard when mobile app is foregrounded (showSoftInputOnFocus doesn't work when the app activates from the background)
  useOnMobileAppState('active', !isFieldMounted || showSoftInputOnFocus ? noop : dismissNativeKeyboard)

  return { formattedValue, onChangeFormattedText }
}

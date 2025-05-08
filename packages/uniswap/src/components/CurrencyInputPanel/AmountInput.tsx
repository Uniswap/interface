import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Input, Text } from 'ui/src'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { useOnMobileAppState } from 'utilities/src/device/appState'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { isMobileWeb } from 'utilities/src/platform'
import noop from 'utilities/src/react/noop'

export const numericInputRegex = RegExp('^\\d*(\\.\\d*)?$') // Matches only numeric values without commas

type Props = {
  adjustWidthToContent?: boolean
  fiatCurrencyInfo?: FiatCurrencyInfo
  dimTextColor?: boolean
  maxDecimals?: number
  inputEnforcer?: (value?: string) => boolean
} & TextInputProps

export function replaceSeparators({
  value,
  groupingSeparator,
  decimalSeparator,
  groupingOverride,
  decimalOverride,
}: {
  value: string
  groupingSeparator?: string
  decimalSeparator: string
  groupingOverride?: string
  decimalOverride: string
}): string {
  let outputParts = value.split(decimalSeparator)
  if (groupingSeparator && groupingOverride != null) {
    outputParts = outputParts.map((part) =>
      // eslint-disable-next-line security/detect-non-literal-regexp
      part.replace(new RegExp(`\\${groupingSeparator}`, 'g'), groupingOverride),
    )
  }
  return outputParts.join(decimalOverride)
}

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

/** Returns true if the value matches a number or an empty string */
function numericInputEnforcer(value?: string): boolean {
  return !value || numericInputRegex.test(value)
}

export const AmountInput = forwardRef<Input, Props>(function _AmountInput(
  {
    onChangeText,
    value,
    adjustWidthToContent,
    dimTextColor,
    showSoftInputOnFocus,
    maxDecimals,
    fiatCurrencyInfo,
    inputEnforcer = numericInputEnforcer,
    ...rest
  },
  ref,
) {
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const targetFiatCurrencyInfo = fiatCurrencyInfo || appFiatCurrencyInfo
  const { groupingSeparator, decimalSeparator } = targetFiatCurrencyInfo
  const { decimalSeparator: nativeKeyboardDecimalSeparator } = getNumberFormatSettings()

  useEffect(() => {
    // Resets input if non-numeric value is passed
    if (!inputEnforcer(value)) {
      onChangeText?.('')
    }
  }, [inputEnforcer, onChangeText, value])

  const handleChange = useCallback(
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

  const [width, setWidth] = useState(0)
  const textInputProps: TextInputProps = useMemo(
    () => ({
      ref,
      color: !value || dimTextColor ? '$neutral3' : '$neutral1',
      keyboardType: 'decimal-pad',
      value: formattedValue,
      onChangeText: handleChange,
      ...rest,
      ...(adjustWidthToContent ? { width } : {}),
    }),
    [ref, value, dimTextColor, formattedValue, handleChange, rest, width, adjustWidthToContent],
  )

  // Dismiss keyboard when mobile app is foregrounded (showSoftInputOnFocus doesn't work when the app activates from the background)
  useOnMobileAppState('active', showSoftInputOnFocus ? noop : dismissNativeKeyboard)

  // break down into two different components depending on value of showSoftInputOnFocus
  // when showSoftInputOnFocus value changes from false to true, React does not remount the component
  // and therefore the keyboard does not pop up on TextInput focus.
  // returning a separately named component guarantees the remount
  const textInputElement = showSoftInputOnFocus ? (
    <TextInputWithNativeKeyboard {...textInputProps} />
  ) : (
    <TextInput {...textInputProps} showSoftInputOnFocus={false} />
  )

  if (adjustWidthToContent) {
    return (
      <>
        <Text
          // Hidden element measures text width to keep input width consistent when a currency symbol is present,
          // preventing it from using all horizontal space.
          fontFamily="$heading"
          fontSize={textInputProps.fontSize}
          fontWeight="500"
          height={0}
          numberOfLines={1}
          overflow="hidden"
          position="absolute"
          onLayout={(e) =>
            setWidth(
              Math.min(
                e.nativeEvent.layout.width,
                typeof textInputProps.maxWidth === 'number' ? textInputProps.maxWidth : +Infinity,
              ),
            )
          }
        >
          {value || textInputProps.placeholder}
        </Text>
        {textInputElement}
      </>
    )
  }

  return textInputElement
})

const TextInputWithNativeKeyboard = forwardRef<Input, TextInputProps>(function _TextInputWithNativeKeyboard(
  props: TextInputProps,
  ref,
) {
  return <TextInput ref={ref} {...props} />
})

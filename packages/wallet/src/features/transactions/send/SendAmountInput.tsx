import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useLayoutEffect, useState } from 'react'
import { NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native'
import { Flex, FlexProps, Text, TouchableArea } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { ParsedWarnings, WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useTokenAndFiatDisplayAmounts } from 'uniswap/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts'

type SendAmountInputProps = {
  currencyInfo: Maybe<CurrencyInfo>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  value?: string
  usdValue: Maybe<CurrencyAmount<Currency>>
  isFiatInput: boolean
  warnings: ParsedWarnings
  focus?: boolean
  autoFocus?: boolean
  onSetExactAmount: (amount: string) => void
  onToggleIsFiatMode: (isFiatMode: boolean) => void
  onSelectionChange?: (start: number, end: number) => void
} & FlexProps

const MAX_INPUT_FONT_SIZE = 52
const MIN_INPUT_FONT_SIZE = 24
const MAX_CHAR_PIXEL_WIDTH = 52

export function SendAmountInput({
  currencyInfo,
  currencyAmount,
  value,
  isFiatInput,
  warnings,
  onSelectionChange: selectionChange,
  onSetExactAmount,
  onToggleIsFiatMode,
  usdValue,
  ...rest
}: SendAmountInputProps): JSX.Element {
  const { symbol } = useAppFiatCurrencyInfo()
  const { isTestnetModeEnabled } = useEnabledChains()

  const onSelectionChange = useCallback(
    ({
      nativeEvent: {
        selection: { start, end },
      },
    }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => selectionChange?.(start, end),
    [selectionChange],
  )

  // Display the fiat equivalent amount if the input is in fiat mode, otherwise display the token amount if fiat mode
  const tokenOrFiatEquivalentAmount = useTokenAndFiatDisplayAmounts({
    value,
    currencyInfo,
    currencyAmount,
    usdValue,
    isFiatMode: isFiatInput,
  })

  const _onToggleIsFiatMode = useCallback(() => {
    onToggleIsFiatMode(!isFiatInput)
  }, [isFiatInput, onToggleIsFiatMode])

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
    maxFontSize: MAX_INPUT_FONT_SIZE,
    minFontSize: MIN_INPUT_FONT_SIZE,
  })
  const [containerWidth, setContainerWidth] = useState(0)

  // Resize font value when value changes
  useLayoutEffect(() => {
    if (value) {
      // Account for currency sign if fiat mode in text width
      const formattedValueString = isFiatInput ? symbol + value : value
      onSetFontSize(formattedValueString)
      // Always set font size if focused to format placeholder size, we need to pass in a non-empty string to avoid formatting crash
    } else {
      onSetFontSize('0')
    }
  }, [isFiatInput, onSetFontSize, symbol, value])

  const { formScreenWarning } = warnings
  const insufficientGasFunds = formScreenWarning?.warning.type === WarningLabel.InsufficientGasFunds

  // We ignore this specific warning type because we have dedicated UI for this in the review button
  const warning = insufficientGasFunds ? undefined : formScreenWarning
  const subTextValue = warning ? warning.warning.title : tokenOrFiatEquivalentAmount
  const subTextValueColor = warning ? '$statusCritical' : '$neutral2'
  const inputColor = !value ? '$neutral3' : '$neutral1'

  return (
    <Flex
      centered
      gap="$spacing16"
      onLayout={(e): void => {
        onLayout(e)
        setContainerWidth(e.nativeEvent.layout.width)
        // Avoid case where onSetFontSize is called before onLayout, resulting in incorrect sizing if view is re-mounted
        onSetFontSize(value || '0')
      }}
      {...rest}
    >
      <Flex row alignItems="center" height={MAX_INPUT_FONT_SIZE} justifyContent="center" overflow="hidden">
        {isFiatInput && (
          <Text allowFontScaling color={inputColor} fontSize={fontSize} height={fontSize} lineHeight={fontSize}>
            {symbol}
          </Text>
        )}
        {currencyInfo ? (
          <AmountInput
            adjustWidthToContent={isFiatInput}
            backgroundColor="$transparent"
            borderWidth="$none"
            color={inputColor}
            focusable={Boolean(currencyInfo)}
            fontFamily="$heading"
            fontSize={fontSize}
            maxDecimals={currencyInfo.currency.decimals}
            maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
            // x0.5 is to mimic the behavior for non-fiat input
            maxWidth={isFiatInput ? containerWidth * 0.5 : undefined}
            minHeight={2 * MAX_INPUT_FONT_SIZE}
            overflow="visible"
            placeholder="0"
            placeholderTextColor="$neutral3"
            px="$none"
            py="$none"
            testID="amount-input-in"
            textAlign={isFiatInput ? 'left' : 'center'}
            value={value}
            onChangeText={onSetExactAmount}
            onSelectionChange={onSelectionChange}
          />
        ) : (
          <Text color="$neutral3" variant="heading3">
            0
          </Text>
        )}
      </Flex>
      {/* hide on testnet mode if there's no warning, otherwise show */}
      {(!isTestnetModeEnabled || warning) && (
        <TouchableArea disabled={isTestnetModeEnabled} onPress={_onToggleIsFiatMode}>
          <Flex centered row gap="$spacing4">
            <Text color={subTextValueColor} textAlign="center" variant="subheading2">
              {subTextValue}
            </Text>
            {!warning && <ArrowDownArrowUp color="$neutral3" size="$icon.16" />}
          </Flex>
        </TouchableArea>
      )}
    </Flex>
  )
}

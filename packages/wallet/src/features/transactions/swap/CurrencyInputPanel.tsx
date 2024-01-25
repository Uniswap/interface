/* eslint-disable complexity */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { forwardRef, memo, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
  ViewStyle,
} from 'react-native'
import {
  AnimatedStyleProp,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { AnimatedFlex, Flex, FlexProps, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { fonts, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { useForwardRef, usePrevious } from 'utilities/src/react/hooks'
import { AmountInput } from 'wallet/src/components/input/AmountInput'
import { SelectTokenButton } from 'wallet/src/components/TokenSelector/SelectTokenButton'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { MaxAmountButton } from 'wallet/src/features/transactions/swap/MaxAmountButton'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { useDynamicFontSizing } from 'wallet/src/utils/useDynamicFontSizing'

type CurrentInputPanelProps = {
  autoFocus?: boolean
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyField: CurrencyField
  currencyInfo: Maybe<CurrencyInfo>
  isLoading?: boolean
  isCollapsed: boolean
  focus?: boolean
  isFiatMode?: boolean
  onPressIn?: () => void
  onSelectionChange?: (start: number, end: number) => void
  onSetExactAmount: (amount: string) => void
  onSetMax?: (amount: string, currencyField: CurrencyField) => void
  onShowTokenSelector: () => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  selection?: TextInputProps['selection']
  showNonZeroBalancesOnly?: boolean
  showSoftInputOnFocus?: boolean
  usdValue: Maybe<CurrencyAmount<Currency>>
  value?: string
  resetSelection: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
} & FlexProps

const MAX_INPUT_FONT_SIZE = 42
const MIN_INPUT_FONT_SIZE = 24

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 23

/** Input panel for a single side of a swap action. */

export const CurrencyInputPanel = memo(
  forwardRef<TextInput, CurrentInputPanelProps>(function _CurrencyInputPanel(
    {
      autoFocus,
      currencyAmount,
      currencyBalance,
      currencyField,
      currencyInfo,
      isLoading,
      isCollapsed,
      focus,
      isFiatMode = false,
      onPressIn,
      onSelectionChange: selectionChange,
      onSetExactAmount,
      onSetMax,
      onShowTokenSelector,
      onToggleIsFiatMode,
      showNonZeroBalancesOnly = true,
      showSoftInputOnFocus = false,
      usdValue,
      resetSelection,
      value,
      ...rest
    },
    forwardedRef
  ): JSX.Element {
    const colors = useSporeColors()
    const { convertFiatAmountFormatted, formatCurrencyAmount, addFiatSymbolToNumber } =
      useLocalizationContext()

    const inputRef = useRef<TextInput>(null)
    const appFiatCurrency = useAppFiatCurrencyInfo()

    useForwardRef(forwardedRef, inputRef)

    const isOutput = currencyField === CurrencyField.OUTPUT

    const showInsufficientBalanceWarning =
      !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

    const formattedFiatValue: string = convertFiatAmountFormatted(
      usdValue?.toExact(),
      NumberType.FiatTokenQuantity
    )

    const _onToggleIsFiatMode = useCallback(() => {
      onToggleIsFiatMode(currencyField)
    }, [currencyField, onToggleIsFiatMode])

    const formattedCurrencyAmount = currencyAmount
      ? formatCurrencyAmount({ value: currencyAmount, type: NumberType.TokenTx })
      : ''

    // the focus state for native Inputs can sometimes be out of sync with the controlled `focus`
    // prop. When the internal focus state differs from our `focus` prop, sync the internal
    // focus state to be what our prop says it should be
    const isTextInputRefActuallyFocused = inputRef.current?.isFocused()
    useEffect(() => {
      if (focus && !isTextInputRefActuallyFocused) {
        inputRef.current?.focus()
        resetSelection({
          start: value?.length ?? 0,
          end: value?.length ?? 0,
          currencyField,
        })
      } else if (!focus && isTextInputRefActuallyFocused) {
        inputRef.current?.blur()
      }
    }, [
      currencyField,
      focus,
      inputRef,
      isTextInputRefActuallyFocused,
      resetSelection,
      value?.length,
    ])

    const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
      MAX_CHAR_PIXEL_WIDTH,
      MAX_INPUT_FONT_SIZE,
      MIN_INPUT_FONT_SIZE
    )

    // This is needed to ensure that the text resizes when modified from outside the component (e.g. custom numpad)
    useEffect(() => {
      if (value) {
        onSetFontSize(value)
        // Always set font size if focused to format placeholder size, we need to pass in a non-empty string to avoid formatting crash
      } else if (focus) {
        onSetFontSize('0')
      }
    }, [focus, onSetFontSize, value])

    const onSelectionChange = useCallback(
      ({
        nativeEvent: {
          selection: { start, end },
        },
      }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => selectionChange?.(start, end),
      [selectionChange]
    )

    // Hide balance if panel is output, and no balance
    const hideCurrencyBalance = isOutput && currencyBalance?.equalTo(0)

    // Only show max button on output if 0 balance, always show on input
    const showMaxButton = !isOutput || (isOutput && currencyBalance?.equalTo(0))

    // when there is no input value, the color should be lighter to account for $ sign when in fiat input mode
    const emptyColor = !value ? '$neutral3' : '$neutral1'
    const inputColor = showInsufficientBalanceWarning ? '$statusCritical' : emptyColor

    // In fiat mode, show equivalent token amount. In token mode, show equivalent fiat amount
    const inputPanelFormattedValue = useMemo((): string => {
      const currencySymbol = currencyInfo ? getSymbolDisplayText(currencyInfo.currency.symbol) : ''
      // handle no value case
      if (!value) {
        return isFiatMode
          ? `${0} ${currencySymbol}`
          : (addFiatSymbolToNumber({
              value: 0,
              currencyCode: appFiatCurrency.code,
              currencySymbol: appFiatCurrency.symbol,
            }).toString() as string)
      }
      // Handle value
      if (isFiatMode) {
        if (formattedCurrencyAmount) {
          return `${formattedCurrencyAmount} ${currencySymbol}`
        }
      } else {
        if (formattedFiatValue && usdValue) {
          return formattedFiatValue
        }
      }
      // Fallback for no formatted value case
      return ''
    }, [
      addFiatSymbolToNumber,
      appFiatCurrency.code,
      appFiatCurrency.symbol,
      currencyInfo,
      formattedCurrencyAmount,
      formattedFiatValue,
      isFiatMode,
      usdValue,
      value,
    ])
    // We need to store the previous value, because new quote request resets `Trade`, and this value, to undefined
    const previousValue = usePrevious(value)
    const loadingTextValue = previousValue && previousValue !== '' ? previousValue : '0'

    const { animatedContainerStyle, animatedAmountInputStyle, animatedInfoRowStyle } =
      useAnimatedContainerStyles(isLoading, isCollapsed)

    const { symbol: fiatCurrencySymbol } = useAppFiatCurrencyInfo()

    // TODO: Remove this when fiat mode is ready to be integrated, to small for feature flag.
    const fiatModeFeatureEnabled = false

    return (
      <TouchableArea hapticFeedback onPress={currencyInfo ? onPressIn : onShowTokenSelector}>
        <AnimatedFlex {...rest} overflow="hidden" px="$spacing16" style={animatedContainerStyle}>
          <AnimatedFlex
            row
            alignItems="center"
            gap="$spacing8"
            justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}
            // Extra space in case choose token text overlaps swap arrow
            pb={!isOutput && !currencyInfo ? '$spacing8' : '$none'}
            pt={isOutput && !currencyInfo ? '$spacing8' : '$none'}>
            <AnimatedFlex
              fill
              grow
              row
              alignItems="center"
              height={MAX_INPUT_FONT_SIZE}
              overflow="hidden"
              style={animatedAmountInputStyle}
              onLayout={onLayout}>
              {isFiatMode && (
                <Text
                  allowFontScaling
                  color={inputColor}
                  style={{
                    fontSize: isCollapsed ? MIN_INPUT_FONT_SIZE : fontSize,
                  }}
                  variant="heading2">
                  {fiatCurrencySymbol}
                </Text>
              )}
              {currencyInfo ? (
                <AmountInput
                  ref={inputRef}
                  autoFocus={autoFocus ?? focus}
                  backgroundColor="$transparent"
                  borderWidth={0}
                  color={inputColor}
                  disabled={!currencyInfo}
                  flex={1}
                  focusable={Boolean(currencyInfo)}
                  fontFamily="$heading"
                  fontSize={isCollapsed ? MIN_INPUT_FONT_SIZE : fontSize}
                  maxDecimals={currencyInfo.currency.decimals}
                  maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
                  // This is a hacky workaround for Android to prevent text from being cut off
                  // (the text input height is greater than the font size and the input is
                  // centered vertically, so the caret is cut off but the text is not)
                  minHeight={2 * MAX_INPUT_FONT_SIZE}
                  overflow="visible"
                  placeholder="0"
                  placeholderTextColor={colors.neutral3.val}
                  px="$none"
                  py="$none"
                  returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
                  // Inline for better interaction with custom selection refs
                  showCurrencySign={false}
                  showSoftInputOnFocus={showSoftInputOnFocus}
                  testID={isOutput ? 'amount-input-out' : 'amount-input-in'}
                  value={isLoading ? loadingTextValue : value}
                  onChangeText={onSetExactAmount}
                  onPressIn={onPressIn}
                  onSelectionChange={onSelectionChange}
                />
              ) : (
                <TouchableArea hapticFeedback onPress={onShowTokenSelector}>
                  <Text color="$neutral3" variant="heading3">
                    0
                  </Text>
                </TouchableArea>
              )}
            </AnimatedFlex>
            <Flex row alignItems="center">
              <SelectTokenButton
                selectedCurrencyInfo={currencyInfo}
                showNonZeroBalancesOnly={showNonZeroBalancesOnly}
                onPress={onShowTokenSelector}
              />
            </Flex>
          </AnimatedFlex>
          <AnimatedFlex
            row
            gap="$spacing8"
            height={spacing.spacing36}
            justifyContent="space-between"
            left={spacing.spacing16}
            paddingTop="$spacing16"
            position="absolute"
            right={spacing.spacing16}
            style={animatedInfoRowStyle}>
            {/* Keep the animated parent container so animation styles are always mounted  */}
            {currencyInfo && (
              <>
                <TouchableArea disabled={fiatModeFeatureEnabled} onPress={_onToggleIsFiatMode}>
                  <Flex centered row shrink gap="$spacing4">
                    <Text color="$neutral2" numberOfLines={1} variant="body3">
                      {inputPanelFormattedValue}
                    </Text>
                    {Boolean(inputPanelFormattedValue && fiatModeFeatureEnabled) && (
                      <Icons.ArrowUpDown color="$neutral3" size="$icon.12" />
                    )}
                  </Flex>
                </TouchableArea>
                <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-end">
                  {!hideCurrencyBalance && (
                    <Text color="$neutral2" variant="body3">
                      {formatCurrencyAmount({
                        value: currencyBalance,
                        type: NumberType.TokenNonTx,
                      })}{' '}
                      {currencyInfo.currency.symbol}
                    </Text>
                  )}
                  {showMaxButton && onSetMax && (
                    <MaxAmountButton currencyField={currencyField} onSetMax={onSetMax} />
                  )}
                </Flex>
              </>
            )}
          </AnimatedFlex>
        </AnimatedFlex>
      </TouchableArea>
    )
  })
)

function useAnimatedContainerStyles(
  isLoading: boolean | undefined,
  isCollapsed: boolean | undefined
): {
  animatedContainerStyle: AnimatedStyleProp<ViewStyle>
  animatedAmountInputStyle: AnimatedStyleProp<ViewStyle>
  animatedInfoRowStyle: AnimatedStyleProp<ViewStyle>
} {
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      paddingTop: withTiming(isCollapsed ? spacing.spacing16 : spacing.spacing24, {
        duration: 300,
      }),
      paddingBottom: withTiming(isCollapsed ? spacing.spacing16 : spacing.spacing48, {
        duration: 300,
      }),
    }
  }, [isCollapsed])

  const loadingFlexProgress = useSharedValue(1)
  loadingFlexProgress.value = withRepeat(
    withSequence(
      withTiming(0.4, { duration: 400, easing: Easing.ease }),
      withTiming(1, { duration: 400, easing: Easing.ease })
    ),
    -1,
    true
  )

  const animatedAmountInputStyle = useAnimatedStyle(
    () => ({
      opacity: isLoading ? loadingFlexProgress.value : 1,
    }),
    [isLoading]
  )

  const animatedInfoRowStyle = useAnimatedStyle(() => {
    return {
      bottom: withTiming(isCollapsed ? -spacing.spacing24 : spacing.spacing16, {
        duration: 300,
      }),
    }
  }, [isCollapsed])

  return {
    animatedContainerStyle,
    animatedAmountInputStyle,
    animatedInfoRowStyle,
  }
}

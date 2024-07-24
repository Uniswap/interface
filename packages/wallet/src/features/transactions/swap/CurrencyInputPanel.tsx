/* eslint-disable complexity */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { RefObject, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { NativeSyntheticEvent, TextInput, TextInputProps, TextInputSelectionChangeEventData } from 'react-native'
import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { Flex, FlexProps, Text, TouchableArea, isWeb, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts } from 'ui/src/theme'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isDetoxBuild } from 'utilities/src/environment/constants'
import { NumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { SelectTokenButton } from 'wallet/src/components/TokenSelector/SelectTokenButton'
import { AmountInput } from 'wallet/src/components/input/AmountInput'
import { MaxAmountButton } from 'wallet/src/components/input/MaxAmountButton'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useTokenAndFiatDisplayAmounts } from 'wallet/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts'
import { MAX_FIAT_INPUT_DECIMALS } from 'wallet/src/features/transactions/utils'
import { errorShakeAnimation } from 'wallet/src/utils/animations'
import { useDynamicFontSizing } from 'wallet/src/utils/useDynamicFontSizing'

type CurrentInputPanelProps = {
  autoFocus?: boolean
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyField: CurrencyField
  currencyInfo: Maybe<CurrencyInfo>
  isLoading?: boolean
  focus?: boolean
  isFiatMode?: boolean
  onPressIn?: () => void
  onSelectionChange?: (start: number, end: number) => void
  onSetExactAmount: (amount: string) => void
  onSetMax?: (amount: string, currencyField: CurrencyField) => void
  onShowTokenSelector: () => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  selection?: TextInputProps['selection']
  showSoftInputOnFocus?: boolean
  usdValue: Maybe<CurrencyAmount<Currency>>
  value?: string
  disabled?: boolean
  onPressDisabled?: () => void
  resetSelection: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
} & FlexProps

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 24

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 23

export type CurrencyInputPanelRef = {
  textInputRef: RefObject<TextInput>
  triggerShakeAnimation: () => void
}

export const CurrencyInputPanel = memo(
  forwardRef<CurrencyInputPanelRef, CurrentInputPanelProps>(function _CurrencyInputPanel(
    {
      autoFocus,
      currencyAmount,
      currencyBalance,
      currencyField,
      currencyInfo,
      isLoading,
      focus,
      isFiatMode = false,
      onPressIn,
      onSelectionChange: selectionChange,
      onSetExactAmount,
      onSetMax,
      onShowTokenSelector,
      onToggleIsFiatMode,
      showSoftInputOnFocus = false,
      usdValue,
      resetSelection,
      value,
      disabled = false,
      onPressDisabled,
      ...rest
    },
    forwardedRef,
  ): JSX.Element {
    const colors = useSporeColors()
    const isShortMobileDevice = useIsShortMobileDevice()
    const { formatCurrencyAmount } = useLocalizationContext()

    const inputRef = useRef<TextInput>(null)

    const shakeValue = useSharedValue(0)

    const shakeStyle = useAnimatedStyle(
      () => ({
        transform: [{ translateX: shakeValue.value }],
      }),
      [shakeValue.value],
    )

    const triggerShakeAnimation = useCallback(() => {
      shakeValue.value = errorShakeAnimation(shakeValue)
    }, [shakeValue])

    useImperativeHandle(forwardedRef, () => ({
      textInputRef: inputRef,
      triggerShakeAnimation,
    }))

    const isOutput = currencyField === CurrencyField.OUTPUT

    const showInsufficientBalanceWarning =
      !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

    const _onToggleIsFiatMode = useCallback(() => {
      onToggleIsFiatMode(currencyField)
    }, [currencyField, onToggleIsFiatMode])

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
    }, [currencyField, focus, inputRef, isTextInputRefActuallyFocused, resetSelection, value?.length])

    const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
      MAX_CHAR_PIXEL_WIDTH,
      MAX_INPUT_FONT_SIZE,
      MIN_INPUT_FONT_SIZE,
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
      [selectionChange],
    )

    // Hide balance if panel is output, and no balance
    const hideCurrencyBalance = isOutput && currencyBalance?.equalTo(0)

    const showMaxButton = !isOutput

    // when there is no input value, the color should be lighter to account for $ sign when in fiat input mode
    const emptyColor = !value ? '$neutral3' : '$neutral1'
    const inputColor = showInsufficientBalanceWarning ? '$statusCritical' : emptyColor

    // In fiat mode, show equivalent token amount. In token mode, show equivalent fiat amount
    const inputPanelFormattedValue = useTokenAndFiatDisplayAmounts({
      value,
      currencyInfo,
      currencyAmount,
      usdValue,
      isFiatMode,
    })

    // We need to store the previous value, because new quote request resets `Trade`, and this value, to undefined
    const previousValue = usePrevious(value)
    const loadingTextValue = previousValue && previousValue !== '' ? previousValue : '0'

    const loadingFlexProgress = useSharedValue(1)

    // disables looping animation during detox e2e tests which was preventing js thread from idle
    if (!isDetoxBuild) {
      loadingFlexProgress.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 400, easing: Easing.ease }),
          withTiming(1, { duration: 400, easing: Easing.ease }),
        ),
        -1,
        true,
      )
    }

    const loadingStyle = useAnimatedStyle(
      () => ({
        opacity: isLoading ? loadingFlexProgress.value : 1,
      }),
      [isLoading, loadingFlexProgress],
    )

    const onPressDisabledWithShakeAnimation = useCallback((): void => {
      onPressDisabled?.()
      triggerShakeAnimation()
    }, [onPressDisabled, triggerShakeAnimation])

    const { symbol: fiatCurrencySymbol } = useAppFiatCurrencyInfo()

    const handleSetMax = useCallback(
      (amount: string) => {
        onSetMax?.(amount, currencyField)
      },
      [currencyField, onSetMax],
    )

    return (
      <TouchableArea
        hapticFeedback
        onPress={disabled ? onPressDisabledWithShakeAnimation : currencyInfo ? onPressIn : onShowTokenSelector}
      >
        <Flex
          {...rest}
          overflow="hidden"
          px="$spacing16"
          py={isWeb ? '$spacing24' : isShortMobileDevice ? '$spacing8' : '$spacing20'}
        >
          <AnimatedFlex
            row
            alignItems="center"
            justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}
            py="$spacing8"
            style={shakeStyle}
          >
            {isFiatMode && (
              <Text
                allowFontScaling
                color={inputColor}
                fontSize={fontSize}
                height={fontSize}
                lineHeight={fontSize}
                mr="$spacing4"
              >
                {fiatCurrencySymbol}
              </Text>
            )}
            <AnimatedFlex
              fill
              grow
              row
              alignItems="center"
              height={MAX_INPUT_FONT_SIZE}
              mr="$spacing8"
              overflow="hidden"
              style={loadingStyle}
              onLayout={onLayout}
            >
              {currencyInfo ? (
                <Flex flexShrink={isWeb ? 1 : 0}>
                  {disabled && (
                    // Invisible TouchableArea overlay to capture onPress events and trigger the shake animation when the input is disabled
                    <TouchableArea
                      style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}
                      onPress={onPressDisabledWithShakeAnimation}
                    />
                  )}
                  <AmountInput
                    ref={inputRef}
                    autoFocus={autoFocus ?? focus}
                    backgroundColor="$transparent"
                    borderWidth={0}
                    color={inputColor}
                    disabled={disabled || !currencyInfo}
                    flex={1}
                    focusable={!disabled && Boolean(currencyInfo)}
                    fontFamily="$heading"
                    // This is a hacky workaround for Android to prevent text from being cut off
                    // (the text input height is greater than the font size and the input is
                    // centered vertically, so the caret is cut off but the text is not)
                    fontSize={fontSize}
                    maxDecimals={isFiatMode ? MAX_FIAT_INPUT_DECIMALS : currencyInfo.currency.decimals}
                    maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
                    minHeight={2 * MAX_INPUT_FONT_SIZE}
                    overflow="visible"
                    placeholder="0"
                    placeholderTextColor={colors.neutral3.val}
                    px="$none"
                    py="$none"
                    returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
                    showSoftInputOnFocus={showSoftInputOnFocus}
                    testID={isOutput ? TestID.AmountInputOut : TestID.AmountInputIn}
                    value={isLoading ? loadingTextValue : value}
                    onChangeText={onSetExactAmount}
                    onPressIn={onPressIn}
                    onSelectionChange={onSelectionChange}
                  />
                </Flex>
              ) : (
                <TouchableArea hapticFeedback onPress={onShowTokenSelector}>
                  <Text color="$neutral3" fontSize={fontSize} variant="heading2">
                    0
                  </Text>
                </TouchableArea>
              )}
            </AnimatedFlex>

            <Flex row alignItems="center">
              <SelectTokenButton
                selectedCurrencyInfo={currencyInfo}
                testID={currencyField === CurrencyField.INPUT ? TestID.ChooseInputToken : TestID.ChooseOutputToken}
                onPress={onShowTokenSelector}
              />
            </Flex>
          </AnimatedFlex>
          {currencyInfo && (
            <Flex row gap="$spacing8" justifyContent="space-between">
              <TouchableArea
                flexShrink={1}
                onPress={disabled ? onPressDisabledWithShakeAnimation : _onToggleIsFiatMode}
              >
                <Flex centered row shrink gap="$spacing4">
                  <Text color="$neutral2" numberOfLines={1} variant="body3">
                    {inputPanelFormattedValue}
                  </Text>
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
                  <MaxAmountButton
                    currencyAmount={currencyAmount}
                    currencyBalance={currencyBalance}
                    currencyField={currencyField}
                    onSetMax={handleSetMax}
                  />
                )}
              </Flex>
            </Flex>
          )}
        </Flex>
      </TouchableArea>
    )
  }),
)

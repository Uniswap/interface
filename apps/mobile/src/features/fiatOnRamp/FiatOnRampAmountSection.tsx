import { useFocusEffect } from '@react-navigation/core'
import React, { RefObject, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, TextInput, TextInputSelectionChangeEventData } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { ColorTokens, Flex, HapticFeedback, Text, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, spacing } from 'ui/src/theme'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { SelectTokenButton } from 'uniswap/src/features/fiatOnRamp/SelectTokenButton'
import { FiatCurrencyInfo, FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { usePrevious } from 'utilities/src/react/hooks'
import { DEFAULT_DELAY, useDebounce } from 'utilities/src/time/timing'
import { AmountInput } from 'wallet/src/components/input/AmountInput'
import { useFormatExactCurrencyAmount } from 'wallet/src/features/fiatOnRamp/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { errorShakeAnimation } from 'wallet/src/utils/animations'
import { useDynamicFontSizing } from 'wallet/src/utils/useDynamicFontSizing'

const MAX_INPUT_FONT_SIZE = 56
const MIN_INPUT_FONT_SIZE = 32

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 40

const PREDEFINED_AMOUNTS = [100, 300, 1000]

type OnChangeAmount = (amount: string) => void

function OnRampError({ errorText, color }: { errorText: string; color: ColorTokens }): JSX.Element {
  return (
    <Flex centered>
      <Text color={color} variant="body3">
        {errorText}
      </Text>
    </Flex>
  )
}

interface FiatOnRampAmountSectionProps {
  disabled?: boolean
  value: string
  errorColor: ColorTokens | undefined
  errorText: string | undefined
  currency: FiatOnRampCurrency
  onEnterAmount: OnChangeAmount
  onChoosePredifendAmount: OnChangeAmount
  quoteAmount: number
  quoteCurrencyAmountReady: boolean
  selectTokenLoading: boolean
  onTokenSelectorPress: () => void
  predefinedAmountsSupported: boolean
  appFiatCurrencySupported: boolean
  notAvailableInThisRegion?: boolean
  fiatCurrencyInfo: FiatCurrencyInfo
  onSelectionChange?: (start: number, end: number) => void
}

export type FiatOnRampAmountSectionRef = {
  textInputRef: RefObject<TextInput>
  triggerShakeAnimation: () => void
}

export const FiatOnRampAmountSection = forwardRef<FiatOnRampAmountSectionRef, FiatOnRampAmountSectionProps>(
  function _FiatOnRampAmountSection(
    {
      disabled,
      value,
      onSelectionChange: selectionChange,
      errorColor,
      errorText,
      currency,
      onEnterAmount,
      onChoosePredifendAmount,
      quoteAmount,
      quoteCurrencyAmountReady,
      selectTokenLoading,
      onTokenSelectorPress,
      predefinedAmountsSupported,
      appFiatCurrencySupported,
      notAvailableInThisRegion,
      fiatCurrencyInfo,
    },
    forwardedRef,
  ): JSX.Element {
    const { t } = useTranslation()
    const {
      onLayout: onInputLayout,
      fontSize,
      onSetFontSize,
    } = useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)
    const prevErrorText = usePrevious(errorText)

    const inputRef = useRef<TextInput>(null)

    useImperativeHandle(forwardedRef, () => ({
      textInputRef: inputRef,
      triggerShakeAnimation,
    }))

    // This is needed to ensure that the text resizes when modified from outside the component (e.g. custom numpad)
    useEffect(() => {
      if (value) {
        onSetFontSize(value)
        // Always set font size if focused to format placeholder size, we need to pass in a non-empty string to avoid formatting crash
      } else {
        onSetFontSize('0')
      }
    }, [onSetFontSize, value])

    const onSelectionChange = useCallback(
      ({
        nativeEvent: {
          selection: { start, end },
        },
      }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => selectionChange?.(start, end),
      [selectionChange],
    )

    const inputShakeX = useSharedValue(0)
    const inputAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: inputShakeX.value }],
    }))

    const triggerShakeAnimation = useCallback(() => {
      inputShakeX.value = errorShakeAnimation(inputShakeX)
    }, [inputShakeX])

    useEffect(() => {
      async function shake(): Promise<void> {
        triggerShakeAnimation()
        await HapticFeedback.impact()
      }
      if (errorText && prevErrorText !== errorText) {
        shake().catch(() => undefined)
      }
    }, [errorText, inputShakeX, prevErrorText, triggerShakeAnimation])

    // Design has asked to make it around 100ms and DEFAULT_DELAY is 200ms
    const debouncedErrorText = useDebounce(errorText, DEFAULT_DELAY / 2)

    const formattedAmount = useFormatExactCurrencyAmount(quoteAmount.toString(), currency.currencyInfo?.currency)

    // we want to always focus amount input
    const isTextInputRefActuallyFocused = inputRef.current?.isFocused()
    useFocusEffect(
      useCallback(() => {
        if (!isTextInputRefActuallyFocused) {
          inputRef.current?.focus()
        }
      }, [inputRef, isTextInputRefActuallyFocused]),
    )

    return (
      <Flex alignItems="center" gap="$spacing8" justifyContent="center" onLayout={onInputLayout}>
        <Flex
          height={spacing.spacing24}
          /* We want to reserve the space here, so when error occurs - layout does not jump */
          mt={appFiatCurrencySupported ? '$spacing48' : '$spacing24'}
        >
          {debouncedErrorText && errorColor && (
            <Text color={errorColor} textAlign="center" variant="buttonLabel4">
              {debouncedErrorText}
            </Text>
          )}
        </Flex>
        <AnimatedFlex style={inputAnimatedStyle} width="100%">
          <Flex row alignItems="center" justifyContent="center">
            <Text
              allowFontScaling
              color={!value ? '$neutral3' : '$neutral1'}
              fontSize={fontSize}
              height={fontSize}
              lineHeight={fontSize}
            >
              {fiatCurrencyInfo.symbol}
            </Text>
            <AmountInput
              ref={inputRef}
              adjustWidthToContent
              autoFocus
              alignSelf="stretch"
              backgroundColor="$transparent"
              borderWidth={0}
              disabled={disabled}
              fiatCurrencyInfo={fiatCurrencyInfo}
              fontFamily="$heading"
              fontSize={fontSize}
              maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
              minHeight={MAX_INPUT_FONT_SIZE}
              placeholder="0"
              placeholderTextColor="$neutral3"
              px="$none"
              py="$none"
              returnKeyType={undefined}
              showSoftInputOnFocus={false}
              textAlign="left"
              value={value}
              onChangeText={onEnterAmount}
              onSelectionChange={onSelectionChange}
            />
          </Flex>
        </AnimatedFlex>
        {currency.currencyInfo && formattedAmount && (
          <SelectTokenButton
            amountReady={quoteCurrencyAmountReady}
            disabled={notAvailableInThisRegion}
            formattedAmount={formattedAmount}
            loading={selectTokenLoading}
            selectedCurrencyInfo={currency.currencyInfo}
            testID={TestID.TokenSelectorToggle}
            onPress={onTokenSelectorPress}
          />
        )}
        {predefinedAmountsSupported ? (
          <Flex centered row gap="$spacing12" mt="$spacing16" pb="$spacing4">
            {PREDEFINED_AMOUNTS.map((amount) => (
              <PredefinedAmount
                key={amount}
                amount={amount}
                currentAmount={value}
                disabled={notAvailableInThisRegion}
                fiatCurrencyInfo={fiatCurrencyInfo}
                onPress={onChoosePredifendAmount}
              />
            ))}
          </Flex>
        ) : null}
        {notAvailableInThisRegion ? (
          <OnRampError color="$neutral2" errorText={t('fiatOnRamp.error.unavailable')} />
        ) : !appFiatCurrencySupported ? (
          <OnRampError color="$neutral3" errorText={t('fiatOnRamp.error.usd')} />
        ) : null}
      </Flex>
    )
  },
)

// Predefined amount is only supported for certain currencies
function PredefinedAmount({
  amount,
  onPress,
  currentAmount,
  fiatCurrencyInfo,
  disabled,
}: {
  amount: number
  currentAmount: string
  onPress: (amount: string) => void
  fiatCurrencyInfo: FiatCurrencyInfo
  disabled?: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const { addFiatSymbolToNumber } = useLocalizationContext()
  const formattedAmount = addFiatSymbolToNumber({
    value: amount,
    currencyCode: fiatCurrencyInfo.code,
    currencySymbol: fiatCurrencyInfo.symbol,
  })

  const highlighted = currentAmount === amount.toString()

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={async (): Promise<void> => {
        await HapticFeedback.impact()
        onPress(amount.toString())
      }}
    >
      <Pill
        backgroundColor={!disabled && highlighted ? '$surface2' : '$surface1'}
        customBorderColor={disabled ? colors.surface2.val : colors.surface3.val}
        foregroundColor={colors[disabled ? 'neutral3' : highlighted ? 'neutral1' : 'neutral2'].val}
        label={formattedAmount}
        px="$spacing16"
        textVariant="buttonLabel3"
      />
    </TouchableOpacity>
  )
}

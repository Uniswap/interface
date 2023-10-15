import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useDynamicFontSizing } from 'src/app/hooks'
import { AmountInput } from 'src/components/input/AmountInput'
import { MaxAmountButton } from 'src/components/input/MaxAmountButton'
import { SelectTokenButton } from 'src/components/TokenSelector/SelectTokenButton'
import { AnimatedFlex, Flex, FlexProps, Text, useSporeColors } from 'ui/src'
import { fonts, spacing } from 'ui/src/theme'
import { formatCurrencyAmount, formatNumberOrString, NumberType } from 'utilities/src/format/format'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

const PADDING_ANIMATION_DURATION = 110

type CurrentInputPanelProps = {
  autoFocus?: boolean
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyInfo: Maybe<CurrencyInfo>
  dimTextColor?: boolean
  focus?: boolean
  isOutput?: boolean
  isUSDInput?: boolean
  onPressIn?: () => void
  onSelectionChange?: (start: number, end: number) => void
  onSetExactAmount: (amount: string) => void
  onSetMax?: (amount: string) => void
  onShowTokenSelector: () => void
  selection?: TextInputProps['selection']
  showNonZeroBalancesOnly?: boolean
  showSoftInputOnFocus?: boolean
  usdValue: Maybe<CurrencyAmount<Currency>>
  value?: string
} & FlexProps

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 24

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 23

/** Input panel for a single side of a swap action. */

export const CurrencyInputPanel = memo(function _CurrencyInputPanel({
  autoFocus,
  currencyAmount,
  currencyBalance,
  currencyInfo,
  dimTextColor,
  focus,
  isOutput = false,
  isUSDInput = false,
  onPressIn,
  onSelectionChange: selectionChange,
  onSetExactAmount,
  onSetMax,
  onShowTokenSelector,
  showNonZeroBalancesOnly = true,
  showSoftInputOnFocus = false,
  usdValue,
  value,
  ...rest
}: CurrentInputPanelProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const inputRef = useRef<TextInput>(null)

  const showInsufficientBalanceWarning =
    !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

  const formattedUSDValue = usdValue
    ? formatNumberOrString(usdValue?.toExact(), NumberType.FiatTokenQuantity)
    : ''
  const formattedCurrencyAmount = currencyAmount
    ? formatCurrencyAmount(currencyAmount, NumberType.TokenTx)
    : ''

  // the focus state for native Inputs can sometimes be out of sync with the controlled `focus`
  // prop. When the internal focus state differs from our `focus` prop, sync the internal
  // focus state to be what our prop says it should be
  const isTextInputRefActuallyFocused = inputRef.current?.isFocused()
  useEffect(() => {
    if (focus && !isTextInputRefActuallyFocused) {
      inputRef.current?.focus()
    } else if (!focus && isTextInputRefActuallyFocused) {
      inputRef.current?.blur()
    }
  }, [focus, inputRef, isTextInputRefActuallyFocused])

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
    MAX_CHAR_PIXEL_WIDTH,
    MAX_INPUT_FONT_SIZE,
    MIN_INPUT_FONT_SIZE
  )

  // This is needed to ensure that the text resizes when modified from outside the component (e.g. custom numpad)
  useEffect(() => {
    if (value) {
      onSetFontSize(value)
    }
  }, [value, onSetFontSize])

  const handleSetMax = useCallback(
    (amount: string) => {
      onSetMax?.(amount)
    },
    [onSetMax]
  )

  const onSelectionChange = useCallback(
    ({
      nativeEvent: {
        selection: { start, end },
      },
    }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => selectionChange?.(start, end),
    [selectionChange]
  )

  const placeholderText = isOutput ? t('Receive') : t('Sell')

  const animatedStyle = useAnimatedStyle(() => {
    return {
      paddingVertical: withTiming(focus ? spacing.spacing4 : spacing.none, {
        duration: PADDING_ANIMATION_DURATION,
      }),
    }
  }, [focus])

  return (
    <Flex {...rest} p="$spacing16">
      <AnimatedFlex
        row
        alignItems="center"
        gap="$spacing8"
        justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}
        style={animatedStyle}>
        <Flex
          fill
          grow
          row
          alignItems="center"
          height={MAX_INPUT_FONT_SIZE}
          overflow="hidden"
          onLayout={onLayout}>
          <AmountInput
            ref={inputRef}
            autoFocus={autoFocus ?? focus}
            backgroundColor="$transparent"
            borderWidth={0}
            color={showInsufficientBalanceWarning ? '$statusCritical' : '$neutral1'}
            dimTextColor={dimTextColor}
            flex={1}
            focusable={Boolean(currencyInfo)}
            fontFamily="$heading"
            fontSize={focus ? fontSize : MIN_INPUT_FONT_SIZE}
            maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
            // This is a hacky workaround for Android to prevent text from being cut off
            // (the text input height is greater than the font size and the input is
            // centered vertically, so the caret is cut off but the text is not)
            minHeight={2 * MAX_INPUT_FONT_SIZE}
            overflow="visible"
            placeholder={currencyInfo ? '0' : placeholderText}
            placeholderTextColor={colors.neutral3.val}
            px="$none"
            py="$none"
            returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
            showCurrencySign={isUSDInput}
            showSoftInputOnFocus={showSoftInputOnFocus}
            testID={isOutput ? 'amount-input-out' : 'amount-input-in'}
            value={value}
            onChangeText={onSetExactAmount}
            onPressIn={onPressIn}
            onSelectionChange={onSelectionChange}
          />
        </Flex>
        <Flex row alignItems="center">
          <SelectTokenButton
            selectedCurrencyInfo={currencyInfo}
            showNonZeroBalancesOnly={showNonZeroBalancesOnly}
            onPress={onShowTokenSelector}
          />
        </Flex>
      </AnimatedFlex>

      {currencyInfo && focus && (
        <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between">
          <Flex shrink>
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {!isUSDInput ? formattedUSDValue : formattedCurrencyAmount}
            </Text>
          </Flex>
          <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-end">
            <Text variant="body3">
              {formatCurrencyAmount(currencyBalance, NumberType.TokenNonTx)}{' '}
              {currencyInfo.currency.symbol}
            </Text>

            {onSetMax && (
              <MaxAmountButton
                currencyAmount={currencyAmount}
                currencyBalance={currencyBalance}
                onSetMax={handleSetMax}
              />
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
})

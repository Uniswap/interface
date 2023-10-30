/* eslint-disable complexity */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { forwardRef, memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useDynamicFontSizing } from 'src/app/hooks'
import { AmountInput } from 'src/components/input/AmountInput'
import { MaxAmountButton } from 'src/components/input/MaxAmountButton'
import { SelectTokenButton } from 'src/components/TokenSelector/SelectTokenButton'
import { AnimatedFlex, Flex, FlexProps, Text, TouchableArea, useSporeColors } from 'ui/src'
import { fonts, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { useForwardRef, usePrevious } from 'utilities/src/react/hooks'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { useFiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'

type CurrentInputPanelProps = {
  autoFocus?: boolean
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyInfo: Maybe<CurrencyInfo>
  isLoading?: boolean
  isCollapsed: boolean
  focus?: boolean
  isOutput?: boolean
  isFiatInput?: boolean
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
  resetSelection: (start: number, end: number) => void
} & FlexProps

const MAX_INPUT_FONT_SIZE = 36
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
      currencyInfo,
      isLoading,
      isCollapsed,
      focus,
      isOutput = false,
      isFiatInput = false,
      onPressIn,
      onSelectionChange: selectionChange,
      onSetExactAmount,
      onSetMax,
      onShowTokenSelector,
      showNonZeroBalancesOnly = true,
      showSoftInputOnFocus = false,
      usdValue,
      resetSelection,
      value,
      ...rest
    },
    forwardedRef
  ): JSX.Element {
    const { t } = useTranslation()
    const colors = useSporeColors()
    const { convertFiatAmountFormatted } = useFiatConverter()
    const { formatCurrencyAmount } = useLocalizedFormatter()
    const inputRef = useRef<TextInput>(null)

    useForwardRef(forwardedRef, inputRef)

    const showInsufficientBalanceWarning =
      !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

    const formattedFiatValue = convertFiatAmountFormatted(
      usdValue?.toExact(),
      NumberType.FiatTokenQuantity
    )
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
        resetSelection(value?.length ?? 0, value?.length ?? 0)
      } else if (!focus && isTextInputRefActuallyFocused) {
        inputRef.current?.blur()
      }
    }, [focus, inputRef, isTextInputRefActuallyFocused, resetSelection, value?.length])

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

    // We need to store the previous value, because new quote request resets `Trade`, and this value, to undefined
    const previousValue = usePrevious(value)
    const loadingTextValue = previousValue && previousValue !== '' ? previousValue : '0'

    const loadingFlexProgress = useSharedValue(1)
    loadingFlexProgress.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 400, easing: Easing.ease }),
        withTiming(1, { duration: 400, easing: Easing.ease })
      ),
      -1,
      true
    )
    const loadingOpacityStyle = useAnimatedStyle(
      () => ({
        opacity: isLoading ? loadingFlexProgress.value : 1,
      }),
      [isLoading]
    )

    const animatePaddingdStyle = useAnimatedStyle(() => {
      return {
        paddingTop: withTiming(focus ? spacing.spacing24 : spacing.spacing16, {
          duration: 300,
        }),
        paddingBottom: withTiming(focus ? spacing.spacing48 : spacing.spacing16, {
          duration: 300,
        }),
      }
    }, [focus])

    const animatedExpandedRowStyle = useAnimatedStyle(() => {
      return {
        bottom: withTiming(focus ? spacing.spacing16 : -spacing.spacing24, {
          duration: 300,
        }),
      }
    }, [focus])

    return (
      <AnimatedFlex
        {...rest}
        overflow="hidden"
        paddingBottom="$spacing16"
        px="$spacing16"
        style={animatePaddingdStyle}
        onPressIn={currencyInfo ? onPressIn : onShowTokenSelector}>
        <AnimatedFlex
          row
          alignItems="center"
          gap="$spacing8"
          justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}>
          <AnimatedFlex
            fill
            grow
            row
            alignItems="center"
            height={MAX_INPUT_FONT_SIZE}
            overflow="hidden"
            style={loadingOpacityStyle}
            onLayout={onLayout}>
            {currencyInfo ? (
              <AmountInput
                ref={inputRef}
                autoFocus={autoFocus ?? focus}
                backgroundColor="$transparent"
                borderWidth={0}
                color={showInsufficientBalanceWarning ? '$statusCritical' : '$neutral1'}
                disabled={!currencyInfo}
                flex={1}
                focusable={Boolean(currencyInfo)}
                fontFamily="$heading"
                fontSize={isCollapsed ? MIN_INPUT_FONT_SIZE : fontSize}
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
                showCurrencySign={isFiatInput}
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
                  {isOutput ? t('Receive') : t('Send')}
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

        {currencyInfo && (
          <AnimatedFlex
            row
            gap="$spacing8"
            height={spacing.spacing36}
            justifyContent="space-between"
            left={spacing.spacing16}
            paddingTop="$spacing16"
            position="absolute"
            style={animatedExpandedRowStyle}
            width="100%">
            <Flex shrink>
              <Text color="$neutral2" numberOfLines={1} variant="body3">
                {!isFiatInput ? (usdValue ? formattedFiatValue : '') : formattedCurrencyAmount}
              </Text>
            </Flex>
            <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-end">
              <Text color="$neutral2" variant="body3">
                {formatCurrencyAmount({ value: currencyBalance, type: NumberType.TokenNonTx })}{' '}
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
          </AnimatedFlex>
        )}
      </AnimatedFlex>
    )
  })
)

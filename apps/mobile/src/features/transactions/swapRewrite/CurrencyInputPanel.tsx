import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { forwardRef, memo, useCallback, useEffect, useRef } from 'react'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'
import { useDynamicFontSizing } from 'src/app/hooks'
import { AmountInput } from 'src/components/input/AmountInput'
import { MaxAmountButton } from 'src/components/input/MaxAmountButton'
import { SelectTokenButton } from 'src/components/TokenSelector/SelectTokenButton'
import { AnimatedFlex, Flex, FlexProps, Text, useSporeColors } from 'ui/src'
import { fonts, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/format'
import { useForwardRef } from 'utilities/src/react/hooks'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { useFiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'

type CurrentInputPanelProps = {
  autoFocus?: boolean
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyInfo: Maybe<CurrencyInfo>
  dimTextColor?: boolean
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
      dimTextColor,
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
      value,
      ...rest
    },
    forwardedRef
  ): JSX.Element {
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

    return (
      <Flex
        {...rest}
        paddingBottom="$spacing16"
        paddingTop={!focus ? '$spacing16' : '$spacing24'}
        px="$spacing16">
        <AnimatedFlex
          row
          alignItems="center"
          gap="$spacing8"
          justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}>
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
              placeholder="0"
              placeholderTextColor={colors.neutral3.val}
              px="$none"
              py="$none"
              returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
              showCurrencySign={isFiatInput}
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
          <Flex
            row
            alignContent="center"
            alignItems="center"
            gap="$spacing8"
            // TODO: remove this fix height when we implement "getMax" button, this is to keep entire container hieight consistent on focus change
            height={spacing.spacing36}
            justifyContent="space-between"
            paddingTop="$spacing16">
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
          </Flex>
        )}
      </Flex>
    )
  })
)

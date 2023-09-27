import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import _ from 'lodash'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'
import { AmountInput } from 'src/components/input/AmountInput'
import { MaxAmountButton } from 'src/components/input/MaxAmountButton'
import { Warning, WarningLabel } from 'src/components/modals/WarningModal/types'
import { SelectTokenButton } from 'src/components/TokenSelector/SelectTokenButton'
import { useDynamicFontSizing } from 'src/features/transactions/hooks'
import { Flex, Text, useSporeColors } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { Theme } from 'ui/src/theme/restyle'
import { formatCurrencyAmount, formatNumberOrString, NumberType } from 'utilities/src/format/format'
import { useMemoCompare } from 'utilities/src/react/hooks'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

const restyleFunctions = [backgroundColor]
type RestyleProps = BackgroundColorProps<Theme>

type CurrentInputPanelProps = {
  currencyInfo: Maybe<CurrencyInfo>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  onShowTokenSelector: () => void
  onSetExactAmount: (amount: string) => void
  value?: string
  showNonZeroBalancesOnly?: boolean
  showSoftInputOnFocus?: boolean
  autoFocus?: boolean
  focus?: boolean
  isOutput?: boolean
  isUSDInput?: boolean
  onSetMax?: (amount: string) => void
  onPressIn?: () => void
  warnings: Warning[]
  dimTextColor?: boolean
  selection?: TextInputProps['selection']
  onSelectionChange?: (start: number, end: number) => void
  usdValue: Maybe<CurrencyAmount<Currency>>
} & RestyleProps

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 24

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 23

/** Input panel for a single side of a transfer action. */
function _CurrencyInputPanel(props: CurrentInputPanelProps): JSX.Element {
  const {
    currencyAmount,
    currencyBalance,
    currencyInfo,
    onSetExactAmount,
    onSetMax,
    onShowTokenSelector,
    value,
    showNonZeroBalancesOnly = true,
    showSoftInputOnFocus = false,
    focus,
    autoFocus,
    isOutput = false,
    isUSDInput = false,
    onPressIn,
    warnings,
    dimTextColor,
    onSelectionChange: selectionChange,
    usdValue,
    ...rest
  } = props

  const colors = useSporeColors()
  const { t } = useTranslation()
  const transformedProps = useRestyle(
    restyleFunctions,
    useMemoCompare(() => rest, _.isEqual)
  )
  const inputRef = useRef<TextInput>(null)

  const insufficientBalanceWarning = warnings.find(
    (warning) => warning.type === WarningLabel.InsufficientFunds
  )

  const showInsufficientBalanceWarning = insufficientBalanceWarning && !isOutput

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

  return (
    <Flex {...transformedProps} p="$spacing16">
      <Flex
        row
        alignItems="center"
        gap="$spacing8"
        justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}
        py={focus ? '$spacing4' : '$none'}>
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
            backgroundColor="none"
            borderWidth={0}
            dimTextColor={dimTextColor}
            flex={1}
            focusable={Boolean(currencyInfo)}
            fontFamily={fonts.heading2.family}
            fontSize={focus ? fontSize : MIN_INPUT_FONT_SIZE}
            maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
            // This is a hacky workaround for Android to prevent text from being cut off
            // (the text input height is greater than the font size and the input is
            // centered vertically, so the caret is cut off but the text is not)
            minHeight={2 * MAX_INPUT_FONT_SIZE}
            overflow="visible"
            placeholder={currencyInfo ? '0' : placeholderText}
            placeholderTextColor={colors.neutral3.val}
            px="none"
            py="none"
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
      </Flex>

      {currencyInfo && focus && (
        <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between">
          <Flex shrink>
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {!isUSDInput ? formattedUSDValue : formattedCurrencyAmount}
            </Text>
          </Flex>
          <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-end">
            <Text
              color={showInsufficientBalanceWarning ? '$DEP_accentWarning' : '$neutral2'}
              variant="body3">
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
}

export const CurrencyInputPanel = memo(_CurrencyInputPanel)

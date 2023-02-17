import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import _ from 'lodash'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, TextInputProps } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { AmountInput } from 'src/components/input/AmountInput'
import { MaxAmountButton } from 'src/components/input/MaxAmountButton'
import { Flex } from 'src/components/layout/Flex'
import { Warning, WarningLabel } from 'src/components/modals/WarningModal/types'
import { Text } from 'src/components/Text'
import { SelectTokenButton } from 'src/components/TokenSelector/SelectTokenButton'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { useDynamicFontSizing } from 'src/features/transactions/hooks'
import { Theme } from 'src/styles/theme'
import { formatCurrencyAmount, formatNumberOrString, NumberType } from 'src/utils/format'
import { useMemoCompare } from 'src/utils/hooks'

const restyleFunctions = [backgroundColor]
type RestyleProps = BackgroundColorProps<Theme>

type CurrentInputPanelProps = {
  currencyInfo: NullUndefined<CurrencyInfo>
  currencyAmount: NullUndefined<CurrencyAmount<Currency>>
  currencyBalance: NullUndefined<CurrencyAmount<Currency>>
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
  usdValue: CurrencyAmount<Currency> | null

  // sometimes CurrencyInputPanel rendered off screen like with Send input -> selector flow
  isOnScreen?: boolean
} & RestyleProps

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 18

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 23

interface DynamicSwapPanelPaddingValues {
  paddingBottom: keyof Theme['spacing']
  paddingTop: keyof Theme['spacing']
  paddingHorizontal?: keyof Theme['spacing']
}

const getSwapPanelPaddingValues = (
  isOutputBox: boolean,
  hasCurrencyValue: boolean
): { outerPadding: DynamicSwapPanelPaddingValues; innerPadding: DynamicSwapPanelPaddingValues } => {
  const outerPadding: DynamicSwapPanelPaddingValues = hasCurrencyValue
    ? {
        // when there is a currency value, and the box is on the top, add a bit more
        // padding (spacing24) to account for the swap direction button
        paddingBottom: isOutputBox ? 'spacing16' : 'spacing24',
        paddingTop: isOutputBox ? 'spacing24' : 'spacing16',
        paddingHorizontal: 'spacing16',
      }
    : {
        // spacing48 to account for the direction button (on the top or the bottom, depending
        // on whether this component is the top or bottom swap box)
        paddingBottom: isOutputBox ? 'spacing36' : 'spacing48',
        paddingTop: isOutputBox ? 'spacing48' : 'spacing36',
        paddingHorizontal: 'spacing16',
      }

  const innerPadding: DynamicSwapPanelPaddingValues = {
    // when there is a currency value, and the box is on the top, add a bit more
    // 20px is the desired amount, so we're adding outer padding and inner padding (16px + 4px)
    paddingBottom: isOutputBox ? 'spacing4' : 'none',
    // 20px is the desired amount, so we're adding outer padding and inner padding (16px + 4px)
    paddingTop: isOutputBox ? 'none' : 'spacing4',
  }

  return { outerPadding, innerPadding }
}

/** Input panel for a single side of a transfer action. */
export function _CurrencyInputPanel(props: CurrentInputPanelProps): JSX.Element {
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
    isOnScreen,
    ...rest
  } = props

  const theme = useAppTheme()
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
    if (focus && !isTextInputRefActuallyFocused && isOnScreen) {
      inputRef.current?.focus()
    } else if (!focus && isTextInputRefActuallyFocused) {
      inputRef.current?.blur()
    }
  }, [focus, inputRef, isTextInputRefActuallyFocused, isOnScreen])

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
    MAX_CHAR_PIXEL_WIDTH,
    MAX_INPUT_FONT_SIZE,
    MIN_INPUT_FONT_SIZE
  )

  // Handle native numpad keyboard input
  const onChangeText = useCallback(
    (newAmount: string) => {
      onSetFontSize(newAmount)
      onSetExactAmount(newAmount)
    },
    [onSetFontSize, onSetExactAmount]
  )

  // This is needed to ensure that the text resizes when modified from outside the component (e.g. custom numpad)
  useEffect(() => {
    if (value) {
      onSetFontSize(value)
    }
  }, [value, onSetFontSize])

  const handleSetMax = useCallback(
    (amount: string) => {
      if (!onSetMax) {
        return
      }
      onSetMax(amount)
      onChangeText(amount)
    },
    [onChangeText, onSetMax]
  )

  const onSelectionChange = useCallback(
    ({
      nativeEvent: {
        selection: { start, end },
      },
    }) => selectionChange && selectionChange(start, end),
    [selectionChange]
  )

  const paddingStyles = useMemo(
    () => getSwapPanelPaddingValues(isOutput, Boolean(currencyInfo)),
    [isOutput, currencyInfo]
  )

  const { outerPadding, innerPadding } = paddingStyles
  const { paddingBottom, paddingTop, paddingHorizontal } = outerPadding
  const { paddingBottom: innerPaddingBottom, paddingTop: innerPaddingTop } = innerPadding

  return (
    <Flex
      gap="spacing12"
      {...transformedProps}
      pb={paddingBottom}
      pt={paddingTop}
      px={paddingHorizontal}>
      <Flex
        row
        alignItems="center"
        gap="spacing8"
        justifyContent={!currencyInfo ? 'center' : 'space-between'}
        paddingBottom={innerPaddingBottom}
        paddingTop={innerPaddingTop}>
        {currencyInfo && (
          <Flex fill grow row onLayout={onLayout}>
            <AmountInput
              ref={inputRef}
              alignSelf="stretch"
              autoFocus={autoFocus ?? focus}
              backgroundColor="none"
              borderWidth={0}
              dimTextColor={dimTextColor}
              flex={1}
              fontFamily={theme.textVariants.headlineLarge.fontFamily}
              fontSize={fontSize}
              height={MAX_INPUT_FONT_SIZE}
              maxFontSizeMultiplier={theme.textVariants.headlineLarge.maxFontSizeMultiplier}
              overflow="visible"
              placeholder="0"
              placeholderTextColor={theme.colors.textSecondary}
              px="none"
              py="none"
              returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
              showCurrencySign={isUSDInput}
              showSoftInputOnFocus={showSoftInputOnFocus}
              testID={isOutput ? 'amount-input-out' : 'amount-input-in'}
              value={value}
              onChangeText={onChangeText}
              onPressIn={onPressIn}
              onSelectionChange={onSelectionChange}
            />
          </Flex>
        )}
        <Flex row alignItems="center" gap="none">
          <SelectTokenButton
            selectedCurrencyInfo={currencyInfo}
            showNonZeroBalancesOnly={showNonZeroBalancesOnly}
            onPress={onShowTokenSelector}
          />
        </Flex>
      </Flex>

      {currencyInfo && (
        <Flex row alignItems="center" gap="spacing8" justifyContent="space-between" mb="spacing4">
          <Flex shrink>
            <Text color="textSecondary" numberOfLines={1} variant="bodySmall">
              {!isUSDInput ? formattedUSDValue : formattedCurrencyAmount}
            </Text>
          </Flex>
          <Flex row alignItems="center" gap="spacing8" justifyContent="flex-end">
            {showInsufficientBalanceWarning && (
              <Text color="accentWarning" variant="bodySmall">
                {insufficientBalanceWarning.title}
              </Text>
            )}
            {!showInsufficientBalanceWarning && (
              <Text color="textSecondary" variant="bodySmall">
                {t('Balance')}: {formatCurrencyAmount(currencyBalance, NumberType.TokenTx)}
              </Text>
            )}
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

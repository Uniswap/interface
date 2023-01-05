import { backgroundColor, BackgroundColorProps, useRestyle } from '@shopify/restyle'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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

const restyleFunctions = [backgroundColor]
type RestyleProps = BackgroundColorProps<Theme>

type CurrentInputPanelProps = {
  currencyInfo: NullUndefined<CurrencyInfo>
  currencyAmount: NullUndefined<CurrencyAmount<Currency>>
  currencyBalance: NullUndefined<CurrencyAmount<Currency>>
  onShowTokenSelector: () => void
  onSetAmount: (amount: string) => void
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

const getSwapPanelPaddingValues = (isOutputBox: boolean, hasCurrencyValue: boolean) => {
  const outerPadding: DynamicSwapPanelPaddingValues = hasCurrencyValue
    ? {
        // when there is a currency value, and the box is on the top, add a bit more
        // padding (lg) to account for the swap direction button
        paddingBottom: isOutputBox ? 'md' : 'lg',
        paddingTop: isOutputBox ? 'lg' : 'md',
        paddingHorizontal: 'md',
      }
    : {
        // xxl to account for the direction button (on the top or the bottom, depending
        // on whether this component is the top or bottom swap box)
        paddingBottom: isOutputBox ? 'xl' : 'xxl',
        paddingTop: isOutputBox ? 'xxl' : 'xl',
        paddingHorizontal: 'md',
      }

  const innerPadding: DynamicSwapPanelPaddingValues = {
    // when there is a currency value, and the box is on the top, add a bit more
    // 20px is the desired amount, so we're adding outer padding and inner padding md(16px) + xxs(4px)
    paddingBottom: isOutputBox ? 'xxs' : 'none',
    // 20px is the desired amount, so we're adding outer padding and inner padding md(16px) + xxs(4px)
    paddingTop: isOutputBox ? 'none' : 'xxs',
  }

  return { outerPadding, innerPadding }
}

/** Input panel for a single side of a transfer action. */
export function CurrencyInputPanel(props: CurrentInputPanelProps) {
  const {
    currencyAmount,
    currencyBalance,
    currencyInfo,
    onSetAmount,
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
    selection,
    onSelectionChange: selectionChange,
    usdValue,
    isOnScreen,
    ...rest
  } = props

  const theme = useAppTheme()
  const { t } = useTranslation()
  const transformedProps = useRestyle(restyleFunctions, rest)
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

  const onChangeText = useCallback(
    (newAmount: string) => {
      onSetFontSize(newAmount)
      onSetAmount(newAmount)
    },
    [onSetFontSize, onSetAmount]
  )

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
    <Flex gap="sm" {...transformedProps} pb={paddingBottom} pt={paddingTop} px={paddingHorizontal}>
      <Flex
        row
        alignItems="center"
        gap="xxxs"
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
              selection={selection}
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
        <Flex row alignItems="center" gap="xs" justifyContent="space-between" mb="xxs">
          <Text color="textSecondary" variant="bodySmall">
            {!isUSDInput ? formattedUSDValue : formattedCurrencyAmount}
          </Text>
          <Flex row alignItems="center" gap="xs" justifyContent="flex-end">
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

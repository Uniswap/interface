import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDynamicFontSizing } from 'src/app/hooks'
import { AmountInput } from 'src/components/input/AmountInput'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Pill } from 'src/components/text/Pill'
import {
  useFormatExactCurrencyAmount,
  useMoonpayFiatCurrencySupportInfo,
} from 'src/features/fiatOnRamp/hooks'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { ElementName } from 'src/features/telemetry/constants'
import { ColorTokens, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

const MAX_INPUT_FONT_SIZE = 56
const MIN_INPUT_FONT_SIZE = 32

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 40

const PREDEFINED_AMOUNTS = [100, 300, 1000]

type OnChangeAmount = (amount: string) => void

interface Props {
  showNativeKeyboard: boolean
  onInputPanelLayout: (event: LayoutChangeEvent) => void
  inputRef: React.RefObject<TextInput>
  showSoftInputOnFocus: boolean
  value: string
  setSelection: (selection: TextInputProps['selection']) => void
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
}

export function FiatOnRampAmountSection({
  showNativeKeyboard,
  onInputPanelLayout,
  inputRef,
  showSoftInputOnFocus,
  value,
  setSelection,
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
}: Props): JSX.Element {
  const { t } = useTranslation()
  const {
    onLayout: onInputLayout,
    fontSize,
    onSetFontSize,
  } = useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)

  const onChangeValue =
    (next: OnChangeAmount) =>
    (newAmount: string): void => {
      onSetFontSize(newAmount)
      next(newAmount)
    }

  const onSelectionChange = ({
    nativeEvent: {
      selection: { start, end },
    },
  }: NativeSyntheticEvent<TextInputSelectionChangeEventData>): void => {
    setSelection({ start, end })
  }

  const { appFiatCurrencySupportedInMoonpay, moonpaySupportedFiatCurrency } =
    useMoonpayFiatCurrencySupportInfo()
  const { formatNumberOrString } = useLocalizationContext()

  return (
    <Flex gap="$spacing16" onLayout={onInputPanelLayout}>
      <Flex
        grow
        alignItems="center"
        gap="$spacing16"
        justifyContent="center"
        onLayout={onInputLayout}>
        <AmountInput
          ref={inputRef}
          autoFocus
          alignSelf="stretch"
          backgroundColor="$transparent"
          borderWidth={0}
          caretHidden={!showNativeKeyboard}
          fontFamily="$heading"
          fontSize={fontSize}
          maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
          minHeight={MAX_INPUT_FONT_SIZE}
          mt="$spacing48"
          placeholder={formatNumberOrString({
            value: 0,
            type: NumberType.FiatStandard,
            currencyCode: moonpaySupportedFiatCurrency.code,
          })}
          placeholderTextColor="$neutral3"
          px="$none"
          py="$none"
          returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
          showCurrencySign={value !== ''}
          showSoftInputOnFocus={showSoftInputOnFocus}
          textAlign="center"
          value={value}
          onChangeText={onChangeValue(onEnterAmount)}
          onSelectionChange={onSelectionChange}
        />
        {currency.currencyInfo && (
          <SelectTokenButton
            amount={quoteAmount}
            disabled={!quoteCurrencyAmountReady}
            loading={selectTokenLoading}
            selectedCurrencyInfo={currency.currencyInfo}
            onPress={onTokenSelectorPress}
          />
        )}
        <Flex
          /* We want to reserve the space here, so when error occurs - layout does not jump */
          height={spacing.spacing24}>
          {errorText && errorColor && (
            <Text color={errorColor} textAlign="center" variant="buttonLabel4">
              {errorText}
            </Text>
          )}
        </Flex>
        {predefinedAmountsSupported ? (
          <Flex centered row gap="$spacing12" pb="$spacing4">
            {PREDEFINED_AMOUNTS.map((amount) => (
              <PredefinedAmount
                key={amount}
                amount={amount}
                currentAmount={value}
                onPress={onChoosePredifendAmount}
              />
            ))}
          </Flex>
        ) : null}
        {!appFiatCurrencySupportedInMoonpay ? (
          <Flex centered>
            <Text color="$neutral3" variant="body3">
              {t('Only available to purchase in USD')}
            </Text>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

interface SelectTokenButtonProps {
  onPress: () => void
  selectedCurrencyInfo: CurrencyInfo
  amount: number
  disabled?: boolean
  loading?: boolean
}

function SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  amount,
  disabled,
  loading,
}: SelectTokenButtonProps): JSX.Element {
  const formattedAmount = useFormatExactCurrencyAmount(
    amount.toString(),
    selectedCurrencyInfo.currency
  )
  const textColor = disabled ? '$neutral3' : '$neutral2'

  return (
    <TouchableArea
      hapticFeedback
      borderRadius="$roundedFull"
      testID={ElementName.TokenSelectorToggle}
      onPress={onPress}>
      <Flex centered row flexDirection="row" gap="$spacing4" p="$spacing4">
        {loading ? (
          <SpinningLoader />
        ) : (
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon24} />
        )}
        <Text color={textColor} pl="$spacing4" variant="body1">
          {formattedAmount}
        </Text>
        <Text color={textColor} pl="$spacing1" variant="body1">
          {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
        </Text>
        <Icons.RotatableChevron color={textColor} direction="end" height={iconSizes.icon16} />
      </Flex>
    </TouchableArea>
  )
}

// Predefined amount is only supported for certain currencies
function PredefinedAmount({
  amount,
  onPress,
  currentAmount,
}: {
  amount: number
  currentAmount: string
  onPress: (amount: string) => void
}): JSX.Element {
  const colors = useSporeColors()
  const { moonpaySupportedFiatCurrency } = useMoonpayFiatCurrencySupportInfo()
  const { addFiatSymbolToNumber } = useLocalizationContext()
  const formattedAmount = addFiatSymbolToNumber({
    value: amount,
    currencyCode: moonpaySupportedFiatCurrency.code,
    currencySymbol: moonpaySupportedFiatCurrency.symbol,
  })

  const highlighted = currentAmount === formattedAmount

  return (
    <TouchableOpacity onPress={(): void => onPress(amount.toString())}>
      <Pill
        backgroundColor={highlighted ? '$DEP_backgroundActionButton' : '$surface2'}
        foregroundColor={colors[highlighted ? 'accent1' : 'neutral2'].val}
        label={formattedAmount}
        px="$spacing16"
        textVariant="buttonLabel3"
      />
    </TouchableOpacity>
  )
}

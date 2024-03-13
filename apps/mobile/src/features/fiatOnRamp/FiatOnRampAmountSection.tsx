import { impactAsync } from 'expo-haptics'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useFormatExactCurrencyAmount } from 'src/features/fiatOnRamp/hooks'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { AnimatedFlex, ColorTokens, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { DEFAULT_DELAY, useDebounce } from 'utilities/src/time/timing'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { AmountInput } from 'wallet/src/components/input/AmountInput'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { Pill } from 'wallet/src/components/text/Pill'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { FiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { ElementName } from 'wallet/src/telemetry/constants'
import { errorShakeAnimation } from 'wallet/src/utils/animations'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { useDynamicFontSizing } from 'wallet/src/utils/useDynamicFontSizing'

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
  disabled?: boolean
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
  appFiatCurrencySupported: boolean
  fiatCurrencyInfo: FiatCurrencyInfo
}

export function FiatOnRampAmountSection({
  showNativeKeyboard,
  onInputPanelLayout,
  inputRef,
  disabled,
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
  appFiatCurrencySupported,
  fiatCurrencyInfo,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const {
    onLayout: onInputLayout,
    fontSize,
    onSetFontSize,
  } = useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)
  const prevErrorText = usePrevious(errorText)

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

  const { formatNumberOrString } = useLocalizationContext()

  const inputShakeX = useSharedValue(0)
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShakeX.value }],
  }))

  useEffect(() => {
    async function shake(): Promise<void> {
      inputShakeX.value = errorShakeAnimation(inputShakeX)
      await impactAsync()
    }
    if (errorText && prevErrorText !== errorText) {
      shake().catch(() => undefined)
    }
  }, [errorText, inputShakeX, prevErrorText])

  // Design has asked to make it around 100ms and DEFAULT_DELAY is 200ms
  const debouncedErrorText = useDebounce(errorText, DEFAULT_DELAY / 2)

  return (
    <Flex onLayout={onInputPanelLayout}>
      <Flex
        grow
        alignItems="center"
        gap="$spacing8"
        justifyContent="center"
        onLayout={onInputLayout}>
        <AnimatedFlex
          height={spacing.spacing24}
          /* We want to reserve the space here, so when error occurs - layout does not jump */
          mt={appFiatCurrencySupported ? '$spacing48' : '$spacing24'}>
          {debouncedErrorText && errorColor && (
            <Text color={errorColor} textAlign="center" variant="buttonLabel4">
              {debouncedErrorText}
            </Text>
          )}
        </AnimatedFlex>
        <AnimatedFlex style={inputAnimatedStyle}>
          <AmountInput
            ref={inputRef}
            autoFocus
            alignSelf="stretch"
            backgroundColor="$transparent"
            borderWidth={0}
            caretHidden={!showNativeKeyboard}
            disabled={disabled}
            fiatCurrencyInfo={fiatCurrencyInfo}
            fontFamily="$heading"
            fontSize={fontSize}
            maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
            minHeight={MAX_INPUT_FONT_SIZE}
            placeholder={formatNumberOrString({
              value: 0,
              type: NumberType.FiatStandard,
              currencyCode: fiatCurrencyInfo.code,
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
        </AnimatedFlex>
        {currency.currencyInfo && (
          <SelectTokenButton
            amount={quoteAmount}
            disabled={!quoteCurrencyAmountReady}
            loading={selectTokenLoading}
            selectedCurrencyInfo={currency.currencyInfo}
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
                fiatCurrencyInfo={fiatCurrencyInfo}
                onPress={onChoosePredifendAmount}
              />
            ))}
          </Flex>
        ) : null}
        {!appFiatCurrencySupported ? (
          <Flex centered>
            <Text color="$neutral3" variant="body3">
              {t('fiatOnRamp.error.usd')}
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
  const textColor = disabled || loading ? '$neutral3' : '$neutral2'

  return (
    <TouchableArea
      hapticFeedback
      borderRadius="$roundedFull"
      testID={ElementName.TokenSelectorToggle}
      onPress={onPress}>
      <Flex centered row flexDirection="row" gap="$none" p="$spacing4">
        {loading ? (
          <SpinningLoader />
        ) : (
          <CurrencyLogo
            currencyInfo={selectedCurrencyInfo}
            networkLogoBorderWidth={spacing.spacing1}
            size={iconSizes.icon24}
          />
        )}
        <Text color={textColor} pl="$spacing8" variant="body1">
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
  fiatCurrencyInfo,
}: {
  amount: number
  currentAmount: string
  onPress: (amount: string) => void
  fiatCurrencyInfo: FiatCurrencyInfo
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
      onPress={async (): Promise<void> => {
        await impactAsync()
        onPress(amount.toString())
      }}>
      <Pill
        backgroundColor={highlighted ? '$surface2' : '$surface1'}
        customBorderColor={colors.surface3.val}
        foregroundColor={colors[highlighted ? 'neutral1' : 'neutral2'].val}
        label={formattedAmount}
        px="$spacing16"
        textVariant="buttonLabel3"
      />
    </TouchableOpacity>
  )
}

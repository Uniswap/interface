import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react'
import type { NativeSyntheticEvent, TextInput, TextInputSelectionChangeEventData } from 'react-native'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import type { ShakeAnimation } from 'ui/src/animations/hooks/useShakeAnimation'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, spacing } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { AmountInputPresets } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { DefaultTokenOptions } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/DefaultTokenOptions'
import {
  MIN_INPUT_FONT_SIZE,
  useCurrencyInputFontSize,
} from 'uniswap/src/components/CurrencyInputPanel/hooks/useCurrencyInputFontSize'
import type { PanelTextDisplay } from 'uniswap/src/components/CurrencyInputPanel/hooks/useIndicativeQuoteTextDisplay'
import { useInputFocusSync } from 'uniswap/src/components/CurrencyInputPanel/hooks/useInputFocusSync/useInputFocusSync.native'
import { useRefetchAnimationStyle } from 'uniswap/src/components/CurrencyInputPanel/hooks/useRefetchAnimationStyle'
import { SelectTokenButton } from 'uniswap/src/components/CurrencyInputPanel/SelectTokenButton'
import type { CurrencyInputPanelProps, CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { isWebAppDesktop, isWebPlatform } from 'utilities/src/platform'

type CurrencyInputPanelInputProps = {
  shakeAnimation: ShakeAnimation
  showInsufficientBalanceWarning: boolean
  showDefaultTokenOptions: boolean
  indicativeQuoteTextDisplay: PanelTextDisplay
  onPressDisabledWithShakeAnimation: () => void
} & Pick<
  CurrencyInputPanelProps,
  | 'autoFocus'
  | 'currencyAmount'
  | 'currencyBalance'
  | 'currencyField'
  | 'currencyInfo'
  | 'focus'
  | 'isLoading'
  | 'isIndicativeLoading'
  | 'valueIsIndicative'
  | 'isFiatMode'
  | 'onPressIn'
  | 'onSelectionChange'
  | 'onSetExactAmount'
  | 'onShowTokenSelector'
  | 'showSoftInputOnFocus'
  | 'resetSelection'
  | 'disabled'
  | 'onPressDisabled'
  | 'tokenColor'
  | 'maxValuationPresets'
  | 'onSetMaxValuation'
>

export const CurrencyInputPanelInput = memo(
  forwardRef<CurrencyInputPanelRef, CurrencyInputPanelInputProps>(
    function _CurrencyInputPanel(props, forwardedRef): JSX.Element {
      const {
        autoFocus,
        currencyField,
        currencyInfo,
        focus,
        isFiatMode = false,
        onPressIn,
        onSelectionChange: selectionChange,
        onSetExactAmount,
        onShowTokenSelector,
        showSoftInputOnFocus = false,
        resetSelection,
        disabled = false,
        onPressDisabledWithShakeAnimation,
        tokenColor,
        shakeAnimation,
        showInsufficientBalanceWarning,
        showDefaultTokenOptions,
        indicativeQuoteTextDisplay,
        maxValuationPresets,
        onSetMaxValuation,
      } = props

      const colors = useSporeColors()
      const { symbol: fiatCurrencySymbol } = useAppFiatCurrencyInfo()
      const { formatNumberOrString } = useLocalizationContext()

      const { value, color } = indicativeQuoteTextDisplay

      const inputRef = useRef<TextInput | null>(null)

      const { shakeStyle, triggerShakeAnimation } = shakeAnimation

      useImperativeHandle(forwardedRef, () => ({
        textInputRef: inputRef,
        triggerShakeAnimation,
      }))

      const isOutput = currencyField === CurrencyField.OUTPUT

      useInputFocusSync({
        inputRef,
        focus,
        value,
        currencyField,
        resetSelection,
      })

      const inputFontSize = useCurrencyInputFontSize({ value, focus })

      const onSelectionChange = useCallback(
        ({
          nativeEvent: {
            selection: { start, end },
          },
        }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => selectionChange?.(start, end),
        [selectionChange],
      )

      const renderPreset = useCallback(
        (preset: number) => (
          <Button
            fill={false}
            emphasis="tertiary"
            variant="default"
            size="xxsmall"
            py="$spacing6"
            onPress={() => onSetMaxValuation?.(preset)}
          >
            {formatNumberOrString({ value: preset, type: NumberType.TokenNonTx })}
          </Button>
        ),
        [onSetMaxValuation, formatNumberOrString],
      )

      const refetchAnimationStyle = useRefetchAnimationStyle(props)

      return (
        <AnimatedFlex
          row
          alignItems="center"
          justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}
          py="$spacing8"
          minHeight={MIN_INPUT_FONT_SIZE + spacing.spacing36}
          style={shakeStyle}
        >
          {isFiatMode && (
            <Text
              allowFontScaling
              color={showInsufficientBalanceWarning ? '$statusCritical' : color}
              fontSize={inputFontSize.fontSize}
              lineHeight={inputFontSize.lineHeight}
              mr={isWebPlatform ? '$spacing2' : undefined}
            >
              {fiatCurrencySymbol}
            </Text>
          )}
          <AnimatedFlex
            fill
            grow
            row
            alignItems="center"
            minHeight={MIN_INPUT_FONT_SIZE}
            mr="$spacing8"
            style={refetchAnimationStyle}
            onLayout={inputFontSize.onLayout}
          >
            {currencyInfo ? (
              <Flex grow flexShrink={isWebPlatform ? 1 : 0}>
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
                  borderWidth="$none"
                  color={showInsufficientBalanceWarning ? '$statusCritical' : color}
                  disabled={disabled || !currencyInfo}
                  flex={1}
                  focusable={!disabled && Boolean(currencyInfo)}
                  fontFamily="$heading"
                  // This is a hacky workaround for Android to prevent text from being cut off
                  // (the text input height is greater than the font size and the input is
                  // centered vertically, so the caret is cut off but the text is not)
                  fontSize={inputFontSize.fontSize}
                  lineHeight={inputFontSize.lineHeight}
                  fontWeight="$book"
                  maxDecimals={isFiatMode ? MAX_FIAT_INPUT_DECIMALS : currencyInfo.currency.decimals}
                  maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
                  minHeight={inputFontSize.lineHeight}
                  overflow="visible"
                  placeholder="0"
                  placeholderTextColor={colors.neutral3.val}
                  borderRadius={0}
                  px="$none"
                  py="$none"
                  returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
                  showSoftInputOnFocus={showSoftInputOnFocus}
                  testID={isOutput ? TestID.AmountInputOut : TestID.AmountInputIn}
                  value={value}
                  onChangeText={onSetExactAmount}
                  onPressIn={onPressIn}
                  onSelectionChange={onSelectionChange}
                />
              </Flex>
            ) : showDefaultTokenOptions && !isWebAppDesktop ? (
              <DefaultTokenOptions currencyField={CurrencyField.OUTPUT} />
            ) : (
              <TouchableArea onPress={onShowTokenSelector}>
                <Text
                  color="$neutral3"
                  fontSize={inputFontSize.fontSize}
                  variant="heading2"
                  style={{ lineHeight: inputFontSize.fontSize }}
                >
                  0
                </Text>
              </TouchableArea>
            )}
          </AnimatedFlex>
          {maxValuationPresets && onSetMaxValuation ? (
            <AmountInputPresets presets={maxValuationPresets} renderPreset={renderPreset} />
          ) : (
            <Flex row alignItems="center">
              <SelectTokenButton
                selectedCurrencyInfo={currencyInfo}
                testID={currencyField === CurrencyField.INPUT ? TestID.ChooseInputToken : TestID.ChooseOutputToken}
                tokenColor={tokenColor}
                onPress={onShowTokenSelector}
              />
            </Flex>
          )}
        </AnimatedFlex>
      )
    },
  ),
)

/* eslint-disable max-lines */
/* eslint-disable complexity */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { RefObject, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { NativeSyntheticEvent, TextInput, TextInputProps, TextInputSelectionChangeEventData } from 'react-native'
import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { Flex, FlexProps, Text, TouchableArea, isWeb, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { errorShakeAnimation } from 'ui/src/animations/errorShakeAnimation'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts, spacing } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/CurrencyInputPanel/AmountInput'
import { AmountInputPresets } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/PresetAmountButton'
import { SelectTokenButton } from 'uniswap/src/components/CurrencyInputPanel/SelectTokenButton'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { Experiments, SwapPresetsProperties } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentValue, useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { useTokenAndFiatDisplayAmounts } from 'uniswap/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts'
import { DefaultTokenOptions } from 'uniswap/src/features/transactions/swap/form/DefaultTokenOptions'
import { useUSDCPrice } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { isE2EMode } from 'utilities/src/environment/constants'
import { NumberType } from 'utilities/src/format/types'
import { isExtension, isInterfaceDesktop, isMobileWeb } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

type CurrencyInputPanelProps = {
  autoFocus?: boolean
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyField: CurrencyField
  currencyInfo: Maybe<CurrencyInfo>
  isLoading?: boolean
  isIndicativeLoading?: boolean
  focus?: boolean
  isFiatMode?: boolean
  onPressIn?: () => void
  onSelectionChange?: (start: number, end: number) => void
  onSetExactAmount: (amount: string) => void
  onSetPresetValue?: (amount: string, isLessThanMax?: boolean) => void
  onShowTokenSelector?: () => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  selection?: TextInputProps['selection']
  showSoftInputOnFocus?: boolean
  transactionType?: TransactionType
  usdValue: Maybe<CurrencyAmount<Currency>>
  value?: string
  valueIsIndicative?: boolean
  headerLabel?: string
  disabled?: boolean
  onPressDisabled?: () => void
  enableInputOnly?: boolean // only allow the input field to be changed. Clicking elsewhere has no effect
  resetSelection?: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
  tokenColor?: string
} & FlexProps

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 24

// if font changes from `fontFamily.sansSerif.regular` or `MAX_INPUT_FONT_SIZE`
// changes from 36 then width value must be adjusted
const MAX_CHAR_PIXEL_WIDTH = 23

export type CurrencyInputPanelRef = {
  textInputRef: RefObject<TextInput>
  triggerShakeAnimation: () => void
}

export const CurrencyInputPanel = memo(
  forwardRef<CurrencyInputPanelRef, CurrencyInputPanelProps>(
    function _CurrencyInputPanel(props, forwardedRef): JSX.Element {
      const {
        autoFocus,
        currencyAmount,
        currencyBalance,
        currencyField,
        currencyInfo,
        focus,
        isFiatMode = false,
        onPressIn,
        onSelectionChange: selectionChange,
        onSetExactAmount,
        onSetPresetValue,
        onShowTokenSelector,
        onToggleIsFiatMode,
        showSoftInputOnFocus = false,
        resetSelection,
        disabled = false,
        onPressDisabled,
        enableInputOnly,
        headerLabel,
        transactionType,
        tokenColor,
        // We're intentionally taking these props off `rest` so the props of `rest` are correctly passed into `Flex`
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isIndicativeLoading,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isLoading,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        valueIsIndicative,
        ...rest
      } = props

      const dispatch = useDispatch()
      const { t } = useTranslation()
      const colors = useSporeColors()
      const account = useAccountMeta()
      const isShortMobileDevice = useIsShortMobileDevice()
      const { formatCurrencyAmount } = useLocalizationContext()
      const { symbol: fiatCurrencySymbol, code: fiatCurrencyCode } = useAppFiatCurrencyInfo()

      const isInputPresetsEnabled = useExperimentValue<
        Experiments.SwapPresets,
        SwapPresetsProperties.InputEnabled,
        boolean
      >(Experiments.SwapPresets, SwapPresetsProperties.InputEnabled, false)
      const isOutputPresetsEnabled = useExperimentValue<
        Experiments.SwapPresets,
        SwapPresetsProperties.OutputEnabled,
        boolean
      >(Experiments.SwapPresets, SwapPresetsProperties.OutputEnabled, false)

      const showDefaultTokenOptions = isOutputPresetsEnabled && currencyField === CurrencyField.OUTPUT && !currencyInfo

      const indicativeQuotesEnabled = useFeatureFlag(FeatureFlags.IndicativeSwapQuotes)
      const indicativeDisplay = useIndicativeTextDisplay(props)
      const legacyDisplay = useLegacyTextDisplay(props)

      const { isTestnetModeEnabled } = useEnabledChains()
      const display = indicativeQuotesEnabled ? indicativeDisplay : legacyDisplay
      const { value, color, usdValue } = display

      const inputRef = useRef<TextInput>(null)

      const shakeValue = useSharedValue(0)

      const shakeStyle = useAnimatedStyle(
        () => ({
          transform: [{ translateX: shakeValue.value }],
        }),
        [shakeValue.value],
      )

      const triggerShakeAnimation = useCallback(() => {
        shakeValue.value = errorShakeAnimation(shakeValue)
      }, [shakeValue])

      useImperativeHandle(forwardedRef, () => ({
        textInputRef: inputRef,
        triggerShakeAnimation,
      }))

      const isOutput = currencyField === CurrencyField.OUTPUT

      const showInsufficientBalanceWarning =
        !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

      const { price: usdPrice } = useUSDCPrice(currencyInfo?.currency)

      const _onToggleIsFiatMode = useCallback(() => {
        if (!usdPrice) {
          dispatch(
            pushNotification({
              type: AppNotificationType.Error,
              errorMessage: t('swap.error.fiatInputUnavailable', { fiatCurrencyCode }),
              hideDelay: ONE_SECOND_MS * 3,
            }),
          )
        } else {
          onToggleIsFiatMode(currencyField)
        }
      }, [currencyField, dispatch, fiatCurrencyCode, onToggleIsFiatMode, t, usdPrice])

      // For native mobile, given that we're using a custom `DecimalPad`,
      // the input's focus state can sometimes be out of sync with the controlled `focus` prop.
      // When this happens, we want to sync the input's focus state by either auto-focusing or blurring it.
      const isTextInputRefActuallyFocused = inputRef.current?.isFocused()
      useEffect(() => {
        if (isWeb) {
          // We do not want to force-focus the `input` on web.
          // This is only needed when using native mobile's custom `DecimalPad`.
          return
        }

        if (focus === undefined) {
          // Ignore this effect unless `focus` is explicitly set to a boolean.
          return
        }

        if (focus && !isTextInputRefActuallyFocused) {
          resetSelection?.({
            start: value?.length ?? 0,
            end: value?.length ?? 0,
            currencyField,
          })
          setTimeout(() => {
            // We need to wait for the token selector sheet to fully close before triggering this or else it won't work.
            inputRef.current?.focus()
          }, ONE_SECOND_MS / 2)
        } else if (!focus && isTextInputRefActuallyFocused) {
          inputRef.current?.blur()
        }
      }, [currencyField, focus, isTextInputRefActuallyFocused, resetSelection, value?.length])

      const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
        MAX_CHAR_PIXEL_WIDTH,
        MAX_INPUT_FONT_SIZE,
        MIN_INPUT_FONT_SIZE,
      )

      const lineHeight = fontSize * 1.2

      // This is needed to ensure that the text resizes when modified from outside the component (e.g. custom numpad)
      useEffect(() => {
        if (value) {
          onSetFontSize(value)
          // Always set font size if focused to format placeholder size, we need to pass in a non-empty string to avoid formatting crash
        } else if (focus) {
          onSetFontSize('0')
        }
      }, [focus, onSetFontSize, value])

      const onSelectionChange = useCallback(
        ({
          nativeEvent: {
            selection: { start, end },
          },
        }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => selectionChange?.(start, end),
        [selectionChange],
      )

      // Hide balance if panel is output, and no balance
      const hideCurrencyBalance = (isOutput && currencyBalance?.equalTo(0)) || !account

      const showMaxButton = !isOutput && account

      // In fiat mode, show equivalent token amount. In token mode, show equivalent fiat amount
      const inputPanelFormattedValue = useTokenAndFiatDisplayAmounts({
        value,
        currencyInfo,
        currencyAmount,
        usdValue,
        isFiatMode,
      })

      const onPressDisabledWithShakeAnimation = useCallback((): void => {
        onPressDisabled?.()
        triggerShakeAnimation()
      }, [onPressDisabled, triggerShakeAnimation])

      const handleSetPresetValue = useCallback(
        (amount: string, isLessThanMax?: boolean) => {
          onSetPresetValue?.(amount, isLessThanMax)
        },
        [onSetPresetValue],
      )

      const refetchAnimationStyle = useRefetchAnimationStyle(props)
      const showBottomPresets =
        isInputPresetsEnabled && (isExtension || isMobileWeb) && currencyField === CurrencyField.INPUT

      return (
        <TouchableArea
          group
          disabled={enableInputOnly}
          disabledStyle={{
            cursor: 'default',
          }}
          onPress={disabled ? onPressDisabledWithShakeAnimation : currencyInfo ? onPressIn : onShowTokenSelector}
        >
          <Flex {...rest} overflow="hidden" px="$spacing16" py={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
            {headerLabel || showDefaultTokenOptions ? (
              <Flex row justifyContent="space-between">
                <Text color="$neutral2" variant="subheading2" fontSize="$micro">
                  {headerLabel}
                </Text>
                {isInputPresetsEnabled &&
                  isInterfaceDesktop &&
                  currencyField === CurrencyField.INPUT &&
                  currencyBalance && (
                    <AmountInputPresets
                      animateOnHover="rtl"
                      currencyAmount={currencyAmount}
                      currencyBalance={currencyBalance}
                      buttonProps={{ py: '$spacing4' }}
                      onSetPresetValue={handleSetPresetValue}
                    />
                  )}
                {showDefaultTokenOptions && isInterfaceDesktop && (
                  <DefaultTokenOptions currencyField={CurrencyField.OUTPUT} />
                )}
              </Flex>
            ) : null}
            <AnimatedFlex
              row
              alignItems="center"
              justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}
              py="$spacing8"
              minHeight={MAX_INPUT_FONT_SIZE * 1.2 + 2 * spacing.spacing8}
              style={shakeStyle}
            >
              {isFiatMode && (
                <Text
                  allowFontScaling
                  color={showInsufficientBalanceWarning ? '$statusCritical' : color}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  mr={isWeb ? '$spacing2' : undefined}
                >
                  {fiatCurrencySymbol}
                </Text>
              )}
              <AnimatedFlex
                fill
                grow
                row
                alignItems="center"
                height={MAX_INPUT_FONT_SIZE}
                mr="$spacing8"
                overflow="hidden"
                style={refetchAnimationStyle}
                onLayout={onLayout}
              >
                {currencyInfo ? (
                  <Flex grow flexShrink={isWeb ? 1 : 0}>
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
                      fontSize={fontSize}
                      lineHeight={lineHeight}
                      fontWeight="$book"
                      maxDecimals={isFiatMode ? MAX_FIAT_INPUT_DECIMALS : currencyInfo.currency.decimals}
                      maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
                      minHeight={lineHeight}
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
                ) : showDefaultTokenOptions && !isInterfaceDesktop ? (
                  <DefaultTokenOptions currencyField={CurrencyField.OUTPUT} />
                ) : (
                  <TouchableArea onPress={onShowTokenSelector}>
                    <Text color="$neutral3" fontSize={fontSize} variant="heading2" style={{ lineHeight: fontSize }}>
                      0
                    </Text>
                  </TouchableArea>
                )}
              </AnimatedFlex>
              <Flex row alignItems="center">
                <SelectTokenButton
                  selectedCurrencyInfo={currencyInfo}
                  testID={currencyField === CurrencyField.INPUT ? TestID.ChooseInputToken : TestID.ChooseOutputToken}
                  tokenColor={tokenColor}
                  onPress={onShowTokenSelector}
                />
              </Flex>
            </AnimatedFlex>
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              mb={showBottomPresets ? '$spacing6' : undefined}
              // maintain layout when balance is hidden
              {...(!currencyInfo && { opacity: 0, pointerEvents: 'none' })}
            >
              {showBottomPresets && currencyBalance && !currencyAmount ? (
                <Flex position="absolute">
                  <AmountInputPresets
                    animateOnHover={isExtension ? 'ltr' : undefined}
                    buttonProps={{ py: '$spacing4' }}
                    currencyAmount={currencyAmount}
                    currencyBalance={currencyBalance}
                    onSetPresetValue={handleSetPresetValue}
                  />
                </Flex>
              ) : (
                <TouchableArea
                  flexShrink={1}
                  onPress={disabled || isTestnetModeEnabled ? onPressDisabledWithShakeAnimation : _onToggleIsFiatMode}
                >
                  {!isTestnetModeEnabled && (
                    <Flex centered row shrink gap="$spacing4">
                      <Text color="$neutral2" numberOfLines={1} variant="body3">
                        {inputPanelFormattedValue}
                      </Text>
                    </Flex>
                  )}
                </TouchableArea>
              )}
              {currencyInfo && (
                <Flex row centered ml="auto" gap="$spacing4" justifyContent="flex-end">
                  {!hideCurrencyBalance && (
                    <Text color={showInsufficientBalanceWarning ? '$statusCritical' : '$neutral2'} variant="body3">
                      {formatCurrencyAmount({
                        value: currencyBalance,
                        type: NumberType.TokenNonTx,
                      })}{' '}
                      {getSymbolDisplayText(currencyInfo.currency.symbol)}
                    </Text>
                  )}
                  {!isInputPresetsEnabled && showMaxButton && onSetPresetValue && (
                    <PresetAmountButton
                      currencyAmount={currencyAmount}
                      currencyBalance={currencyBalance}
                      currencyField={currencyField}
                      transactionType={transactionType}
                      onSetPresetValue={handleSetPresetValue}
                    />
                  )}
                </Flex>
              )}
            </Flex>
          </Flex>
        </TouchableArea>
      )
    },
  ),
)

type PanelTextDisplay = {
  value: string | undefined
  color: '$neutral1' | '$neutral2' | '$neutral3'
  usdValue?: CurrencyAmount<Currency> | null
}

/**
 * Controls the display value and color upon indicative vs full quote input.
 *
 * Rules:
 * * If the value goes from indicative to full, show the indicative value for another 200ms in neutral2 before changing.
 * * If the value is undefined, but there is input, continue to show the previous value until it gets replaced by a new quote.
 */
function useIndicativeTextDisplay({
  currencyAmount,
  focus,
  isLoading,
  usdValue,
  value,
  valueIsIndicative,
}: CurrencyInputPanelProps): PanelTextDisplay {
  const lastDisplayRef = useRef<PanelTextDisplay>({ value, color: '$neutral3', usdValue })
  const hasInput = Boolean(isLoading || currencyAmount)

  // Clear the lastDisplayRef if input is cleared, so that it is not used upon subsequent input
  useEffect(() => {
    if (!hasInput) {
      lastDisplayRef.current = { value: undefined, color: '$neutral3' }
    }
  }, [hasInput])

  return useMemo(() => {
    // Ignore all indicative treatment when the field is focused
    if (focus) {
      return { value, color: '$neutral1', usdValue }
    }

    if (!value) {
      return hasInput ? lastDisplayRef.current : { value, color: '$neutral3' }
    }

    const color = valueIsIndicative ? '$neutral3' : '$neutral1'

    const display = { value, color, usdValue } as const
    lastDisplayRef.current = display

    return display
  }, [focus, value, usdValue, hasInput, valueIsIndicative])
}

// TODO(WEB-4805): Remove once legacy hook once indicative quotes are fully rolled out and tested
/** Controls the display value and color according to legacy, pre-indicative-quotes logic. */
function useLegacyTextDisplay({ isLoading, value, usdValue }: CurrencyInputPanelProps): PanelTextDisplay {
  // We need to store the previous value, because new quote request resets `Trade`, and this value, to undefined
  const previousValue = usePrevious(value)

  return useMemo(() => {
    // when there is no input value, the color should be lighter to account for $ sign when in fiat input mode
    const color = !value ? '$neutral3' : '$neutral1'
    const loadingTextValue = previousValue && previousValue !== '' ? previousValue : '0'

    return { value: isLoading ? loadingTextValue : value, usdValue, color }
  }, [isLoading, previousValue, value, usdValue])
}

/** Returns an animated opacity based on current indicative and full quote state  */
function useRefetchAnimationStyle({
  currencyAmount,
  isLoading,
  isIndicativeLoading,
  valueIsIndicative,
}: CurrencyInputPanelProps): { opacity: number } {
  const indicativeQuotesEnabled = useFeatureFlag(FeatureFlags.IndicativeSwapQuotes)

  const loadingFlexProgress = useSharedValue(1)

  // disables looping animation during e2e tests which was preventing js thread from idle
  if (!isE2EMode) {
    loadingFlexProgress.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 400, easing: Easing.ease }),
        withTiming(1, { duration: 400, easing: Easing.ease }),
      ),
      -1,
      true,
    )
  }

  const previousAmount = usePrevious(currencyAmount)

  const amountIsTheSame = currencyAmount && previousAmount?.equalTo(currencyAmount)
  const noIndicativeUI = !isIndicativeLoading && !valueIsIndicative

  // The component is 'refetching' the full quote when the amount hasn't changed, and there is no indicative UI being displayed.
  const isRefetching = isLoading && amountIsTheSame && noIndicativeUI

  // If Indicative quotes are disabled, we should animate the loading flex whenever the quote is loading.
  const shouldAnimate = isRefetching || (!indicativeQuotesEnabled && isLoading)

  return useAnimatedStyle(
    () => ({
      opacity: shouldAnimate ? loadingFlexProgress.value : 1,
    }),
    [shouldAnimate, loadingFlexProgress],
  )
}

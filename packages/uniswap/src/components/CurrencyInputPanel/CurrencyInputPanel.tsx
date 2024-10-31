/* eslint-disable complexity */
/* eslint-disable max-lines */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import {
  RefObject,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
// eslint-disable-next-line no-restricted-imports -- type imports are safe
import type { NativeSyntheticEvent, TextInput, TextInputProps, TextInputSelectionChangeEventData } from 'react-native'
import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { Flex, FlexProps, Text, TouchableArea, isWeb, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { errorShakeAnimation } from 'ui/src/animations/errorShakeAnimation'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts, spacing } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/CurrencyInputPanel/AmountInput'
import { MaxAmountButton } from 'uniswap/src/components/CurrencyInputPanel/MaxAmountButton'
import { SelectTokenButton } from 'uniswap/src/components/CurrencyInputPanel/SelectTokenButton'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { useTokenAndFiatDisplayAmounts } from 'uniswap/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { isDetoxBuild } from 'utilities/src/environment/constants'
import { NumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

type CurrentInputPanelProps = {
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
  onSetMax?: (amount: string, currencyField: CurrencyField) => void
  onShowTokenSelector?: () => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  selection?: TextInputProps['selection']
  showSoftInputOnFocus?: boolean
  usdValue: Maybe<CurrencyAmount<Currency>>
  value?: string
  valueIsIndicative?: boolean
  headerLabel?: string
  disabled?: boolean
  onPressDisabled?: () => void
  enableInputOnly?: boolean // only allow the input field to be changed. Clicking elsewhere has no effect
  resetSelection?: (args: { start: number; end?: number; currencyField?: CurrencyField }) => void
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
  forwardRef<CurrencyInputPanelRef, CurrentInputPanelProps>(
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
        onSetMax,
        onShowTokenSelector,
        onToggleIsFiatMode,
        showSoftInputOnFocus = false,
        resetSelection,
        disabled = false,
        onPressDisabled,
        enableInputOnly,
        headerLabel,
        ...rest
      } = props

      const colors = useSporeColors()
      const account = useAccountMeta()
      const isShortMobileDevice = useIsShortMobileDevice()
      const { formatCurrencyAmount } = useLocalizationContext()

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

      const _onToggleIsFiatMode = useCallback(() => {
        onToggleIsFiatMode(currencyField)
      }, [currencyField, onToggleIsFiatMode])

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

      const { symbol: fiatCurrencySymbol } = useAppFiatCurrencyInfo()

      const handleSetMax = useCallback(
        (amount: string) => {
          onSetMax?.(amount, currencyField)
        },
        [currencyField, onSetMax],
      )

      const refetchAnimationStyle = useRefetchAnimationStyle(props)

      return (
        <TouchableArea
          hapticFeedback
          disabled={enableInputOnly}
          disabledStyle={{
            cursor: 'default',
          }}
          onPress={disabled ? onPressDisabledWithShakeAnimation : currencyInfo ? onPressIn : onShowTokenSelector}
        >
          <Flex {...rest} overflow="hidden" px="$spacing16" py={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
            {headerLabel && (
              <Text color="$neutral2" variant="subheading2" fontSize="$micro">
                {headerLabel}
              </Text>
            )}
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
                  mr="$spacing4"
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
                      borderWidth={0}
                      color={color}
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
                ) : (
                  <TouchableArea hapticFeedback onPress={onShowTokenSelector}>
                    <Text color="$neutral3" fontSize={fontSize} variant="heading2">
                      0
                    </Text>
                  </TouchableArea>
                )}
              </AnimatedFlex>
              <Flex row alignItems="center">
                <SelectTokenButton
                  selectedCurrencyInfo={currencyInfo}
                  testID={currencyField === CurrencyField.INPUT ? TestID.ChooseInputToken : TestID.ChooseOutputToken}
                  onPress={onShowTokenSelector}
                />
              </Flex>
            </AnimatedFlex>
            {currencyInfo && (
              <Flex row gap="$spacing8" justifyContent="space-between">
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
                <Flex row centered gap="$spacing4" justifyContent="flex-end">
                  {showInsufficientBalanceWarning && <AlertTriangleFilled color="$neutral2" size="$icon.16" />}
                  {!hideCurrencyBalance && (
                    <Text color="$neutral2" variant="body3">
                      {formatCurrencyAmount({
                        value: currencyBalance,
                        type: NumberType.TokenNonTx,
                      })}{' '}
                      {getSymbolDisplayText(currencyInfo.currency.symbol)}
                    </Text>
                  )}
                  {showMaxButton && onSetMax && (
                    <MaxAmountButton
                      currencyAmount={currencyAmount}
                      currencyBalance={currencyBalance}
                      currencyField={currencyField}
                      onSetMax={handleSetMax}
                    />
                  )}
                </Flex>
              </Flex>
            )}
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
}: CurrentInputPanelProps): PanelTextDisplay {
  const [display, setDisplay] = useState<PanelTextDisplay>({ value, color: '$neutral1' })
  const [displayUsdValue, setDisplayUsdValue] = useState<Maybe<CurrencyAmount<Currency>>>(usdValue)

  const prevDisplay = usePrevious(display)

  /** Show interim state (old value in neutral2) for 200ms before showing the final state. */
  const handleIndicativeTransition = useCallback((interimState: PanelTextDisplay, finalState: PanelTextDisplay) => {
    // If the value has changed again since the delay, this timeout should no-op
    setTimeout(() => setDisplay((prev) => (prev !== interimState ? prev : finalState)), 200)
  }, [])

  const hasInput = Boolean(isLoading || currencyAmount)
  const valueChanged = usePrevious(value) !== value
  const valueWasIndicative = usePrevious(valueIsIndicative)
  useEffect(() => {
    // Display should only be updated if the value has changed and it's not undefined awaiting a new quote.
    if (!valueChanged) {
      return
    }

    if (!value && hasInput) {
      setDisplay({ value, color: '$neutral1' })
      return
    }

    // Handle transition from indicative to full quote.
    if (valueWasIndicative && !valueIsIndicative) {
      setDisplay((prev) => ({ ...prev, color: '$neutral2' }))
      handleIndicativeTransition({ value: prevDisplay?.value, color: '$neutral2' }, display)
    } else {
      // Update display w/ latest value, if indicative -> full transition is not happening.
      setDisplay({ value, color: '$neutral1' })
    }
  }, [
    handleIndicativeTransition,
    hasInput,
    value,
    valueChanged,
    valueIsIndicative,
    valueWasIndicative,
    prevDisplay,
    display,
  ])

  // `usdValue` is not directly synced with `value` changes, so it is handled separately.
  // Only update the displayed USD value when it's defined, or it's undefined and not loading.
  useEffect(() => {
    if (usdValue || !isLoading) {
      setDisplayUsdValue(usdValue)
    }
  }, [usdValue, isLoading])

  // If the input is focused / being edited, pass through the original values and avoid indicative treatment.
  if (focus) {
    return { value, color: '$neutral1', usdValue }
  }
  return { ...display, usdValue: displayUsdValue }
}

// TODO(WEB-4805): Remove once legacy hook once indicative quotes are fully rolled out and tested
/** Controls the display value and color according to legacy, pre-indicative-quotes logic. */
function useLegacyTextDisplay({ isLoading, value, usdValue }: CurrentInputPanelProps): PanelTextDisplay {
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
}: CurrentInputPanelProps): { opacity: number } {
  const indicativeQuotesEnabled = useFeatureFlag(FeatureFlags.IndicativeSwapQuotes)

  const loadingFlexProgress = useSharedValue(1)

  // disables looping animation during detox e2e tests which was preventing js thread from idle
  if (!isDetoxBuild) {
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

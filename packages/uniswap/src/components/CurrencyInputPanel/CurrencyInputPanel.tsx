/* eslint-disable complexity */
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { NativeSyntheticEvent, TextInput, TextInputSelectionChangeEventData } from 'react-native'
import { useDispatch } from 'react-redux'
import { Flex, Text, TouchableArea, isWeb, useIsShortMobileDevice, useShakeAnimation, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts, spacing } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { AmountInputPresets } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { CurrencyInputPanelBalance } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelBalance'
import { CurrencyInputPanelHeader } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelHeader'
import { SelectTokenButton } from 'uniswap/src/components/CurrencyInputPanel/SelectTokenButton'
import {
  MIN_INPUT_FONT_SIZE,
  useCurrencyInputFontSize,
} from 'uniswap/src/components/CurrencyInputPanel/hooks/useCurrencyInputFontSize'
import { useIndicativeQuoteTextDisplay } from 'uniswap/src/components/CurrencyInputPanel/hooks/useIndicativeQuoteTextDisplay'
import { useRefetchAnimationStyle } from 'uniswap/src/components/CurrencyInputPanel/hooks/useRefetchAnimationStyle'
import type { CurrencyInputPanelProps, CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import type { Experiments } from 'uniswap/src/features/gating/experiments'
import { Layers, SwapPresetsProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValueFromLayer } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { useTokenAndFiatDisplayAmounts } from 'uniswap/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { DefaultTokenOptions } from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/DefaultTokenOptions'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isExtension, isInterfaceDesktop, isMobileWeb } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

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
        showMaxButtonOnly = false,
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
        priceDifferencePercentage,
        headerLabel,
        transactionType,
        tokenColor,
        customPanelStyle,
      } = props

      const dispatch = useDispatch()
      const { t } = useTranslation()
      const colors = useSporeColors()
      const account = useAccountMeta()
      const isShortMobileDevice = useIsShortMobileDevice()
      const { formatPercent } = useLocalizationContext()
      const { symbol: fiatCurrencySymbol, code: fiatCurrencyCode } = useAppFiatCurrencyInfo()

      const isInputPresetsEnabled = useExperimentValueFromLayer<Layers.SwapPage, Experiments.SwapPresets, boolean>(
        Layers.SwapPage,
        SwapPresetsProperties.InputEnabled,
        false,
      )
      const isOutputPresetsEnabled = useExperimentValueFromLayer<Layers.SwapPage, Experiments.SwapPresets, boolean>(
        Layers.SwapPage,
        SwapPresetsProperties.OutputEnabled,
        false,
      )

      const display = useIndicativeQuoteTextDisplay(props)

      const { isTestnetModeEnabled } = useEnabledChains()
      const { value, color, usdValue } = display

      const inputRef = useRef<TextInput>(null)

      const { shakeStyle, triggerShakeAnimation } = useShakeAnimation()

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

      const inputFontSize = useCurrencyInputFontSize(value, focus)

      const onSelectionChange = useCallback(
        ({
          nativeEvent: {
            selection: { start, end },
          },
        }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => selectionChange?.(start, end),
        [selectionChange],
      )

      const showMaxButton = (!isInputPresetsEnabled || showMaxButtonOnly) && !isOutput && account
      const showDefaultTokenOptions = isOutputPresetsEnabled && isOutput && !currencyInfo
      const priceUXEnabled = usePriceUXEnabled()
      const showPriceDifference = isOutput && !!currencyInfo && !!currencyAmount
      const showPercentagePresetOptions =
        isInputPresetsEnabled && !showMaxButtonOnly && currencyField === CurrencyField.INPUT

      const showPercentagePresetsOnBottom =
        showPercentagePresetOptions && (isExtension || isMobileWeb || (isInterfaceDesktop && !headerLabel))

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
        (amount: string, percentage: PresetPercentage) => {
          onSetPresetValue?.(amount, percentage)
        },
        [onSetPresetValue],
      )

      const refetchAnimationStyle = useRefetchAnimationStyle(props)

      return (
        <TouchableArea
          group
          disabledStyle={{
            cursor: 'default',
          }}
          onPress={disabled ? onPressDisabledWithShakeAnimation : currencyInfo ? onPressIn : onShowTokenSelector}
        >
          <Flex
            {...customPanelStyle}
            overflow="hidden"
            px="$spacing16"
            py={isShortMobileDevice ? '$spacing8' : '$spacing16'}
          >
            <CurrencyInputPanelHeader
              headerLabel={headerLabel}
              currencyField={currencyField}
              currencyBalance={currencyBalance}
              currencyAmount={currencyAmount}
              currencyInfo={currencyInfo}
              showDefaultTokenOptions={showDefaultTokenOptions}
              onSetPresetValue={handleSetPresetValue}
            />
            <AnimatedFlex
              row
              alignItems="center"
              justifyContent={!currencyInfo ? 'flex-end' : 'space-between'}
              py="$spacing8"
              minHeight={MIN_INPUT_FONT_SIZE * 1.2 + 2 * spacing.spacing8}
              style={shakeStyle}
            >
              {isFiatMode && (
                <Text
                  allowFontScaling
                  color={showInsufficientBalanceWarning ? '$statusCritical' : color}
                  fontSize={inputFontSize.fontSize}
                  lineHeight={inputFontSize.lineHeight}
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
                minHeight={MIN_INPUT_FONT_SIZE}
                mr="$spacing8"
                style={refetchAnimationStyle}
                onLayout={inputFontSize.onLayout}
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
                ) : showDefaultTokenOptions && !isInterfaceDesktop ? (
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
              mb={showPercentagePresetsOnBottom ? '$spacing6' : undefined}
              // maintain layout when balance is hidden
              {...(!currencyInfo && { opacity: 0, pointerEvents: 'none' })}
            >
              {showPercentagePresetsOnBottom && currencyBalance && !currencyAmount ? (
                <Flex position="absolute">
                  <AmountInputPresets
                    hoverLtr
                    buttonProps={{ py: '$spacing4' }}
                    currencyAmount={currencyAmount}
                    currencyBalance={currencyBalance}
                    onSetPresetValue={handleSetPresetValue}
                  />
                </Flex>
              ) : (
                <TouchableArea
                  group="item"
                  flexShrink={1}
                  onPress={disabled || isTestnetModeEnabled ? onPressDisabledWithShakeAnimation : _onToggleIsFiatMode}
                >
                  {!isTestnetModeEnabled && (
                    <Flex centered row shrink gap="$spacing4" width="max-content">
                      <Text
                        color="$neutral2"
                        $group-item-hover={{ color: '$neutral2Hovered' }}
                        numberOfLines={1}
                        variant="body3"
                      >
                        {inputPanelFormattedValue}
                      </Text>
                      {priceUXEnabled && showPriceDifference && (
                        <Text color="$neutral3" variant="body3">
                          ({formatPercent(priceDifferencePercentage)})
                        </Text>
                      )}
                    </Flex>
                  )}
                </TouchableArea>
              )}
              {currencyInfo && (
                <Flex row centered ml="auto" gap="$spacing4" justifyContent="flex-end">
                  <CurrencyInputPanelBalance
                    currencyField={currencyField}
                    currencyBalance={currencyBalance}
                    currencyInfo={currencyInfo}
                    showInsufficientBalanceWarning={showInsufficientBalanceWarning}
                  />
                  {showMaxButton && onSetPresetValue && (
                    <PresetAmountButton
                      currencyAmount={currencyAmount}
                      currencyBalance={currencyBalance}
                      currencyField={currencyField}
                      transactionType={transactionType}
                      buttonProps={{
                        borderWidth: 0,
                      }}
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

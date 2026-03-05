//! tamagui-ignore
// tamagui-ignore
/* eslint-disable complexity */
import { forwardRef, memo, useCallback } from 'react'
import { Flex, TouchableArea, useIsShortMobileDevice, useShakeAnimation } from 'ui/src'
import {
  AmountInputPresets,
  PRESET_BUTTON_PROPS,
} from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { PRESET_PERCENTAGES } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import { CurrencyInputPanelBalance } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelBalance'
import { CurrencyInputPanelHeader } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelHeader'
import { CurrencyInputPanelInput } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelInput'
import { CurrencyInputPanelValue } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelValue'
import { useIndicativeQuoteTextDisplay } from 'uniswap/src/components/CurrencyInputPanel/hooks/useIndicativeQuoteTextDisplay'
import type { CurrencyInputPanelProps, CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isExtensionApp, isMobileWeb, isWebAppDesktop } from 'utilities/src/platform'

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
        showSoftInputOnFocus = false,
        tokenColor,
        onPressIn,
        isLoading,
        valueIsIndicative,
        isIndicativeLoading,
        onSelectionChange: selectionChange,
        onSetExactAmount,
        onSetPresetValue,
        onShowTokenSelector,
        onToggleIsFiatMode,
        resetSelection,
        disabled = false,
        onPressDisabled,
        priceDifferencePercentage,
        headerLabel,
        transactionType,
        customPanelStyle,
        hidePresets,
        onBlur,
        panelAccessory,
        disablePressAnimation,
        fontSizeOptions,
        fiatValueVariant,
        inputRowPaddingVertical,
        panelAccessoryPaddingTop = '$spacing24',
        inputRowMinHeight,
        inputSuffix,
        allowOverflow,
      } = props

      const isShortMobileDevice = useIsShortMobileDevice()

      const display = useIndicativeQuoteTextDisplay(props)
      const { value, usdValue } = display

      const isOutput = currencyField === CurrencyField.OUTPUT

      const showDefaultTokenOptions = isOutput && !currencyInfo

      const showInsufficientBalanceWarning =
        !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

      const showMaxButton = showMaxButtonOnly && !isOutput && !hidePresets
      const showPercentagePresetOptions = !showMaxButtonOnly && !hidePresets && currencyField === CurrencyField.INPUT

      const isDesktop = isWebAppDesktop || isExtensionApp

      const showPercentagePresetsOnBottom = showPercentagePresetOptions && (isMobileWeb || (isDesktop && !headerLabel))

      const shakeAnimation = useShakeAnimation()
      const { triggerShakeAnimation } = shakeAnimation

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

      const renderPreset = useCallback(
        (preset: PresetPercentage) => (
          <PresetAmountButton
            percentage={preset}
            currencyAmount={currencyAmount}
            currencyBalance={currencyBalance}
            currencyField={currencyField}
            transactionType={transactionType}
            elementName={ElementName.PresetPercentage}
            buttonProps={PRESET_BUTTON_PROPS}
            onSetPresetValue={handleSetPresetValue}
          />
        ),
        [currencyAmount, currencyBalance, currencyField, handleSetPresetValue, transactionType],
      )

      return (
        <TouchableArea
          group
          scaleTo={disablePressAnimation ? 1 : undefined}
          disabledStyle={{
            cursor: 'default',
          }}
          onPress={disabled ? onPressDisabledWithShakeAnimation : currencyInfo ? onPressIn : onShowTokenSelector}
        >
          <Flex
            {...customPanelStyle}
            overflow={allowOverflow ? 'visible' : 'hidden'}
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
              hidePresets={hidePresets}
              onSetPresetValue={handleSetPresetValue}
            />
            <CurrencyInputPanelInput
              ref={forwardedRef}
              autoFocus={autoFocus}
              currencyAmount={currencyAmount}
              currencyBalance={currencyBalance}
              currencyField={currencyField}
              currencyInfo={currencyInfo}
              shakeAnimation={shakeAnimation}
              focus={focus}
              isLoading={isLoading}
              isFiatMode={isFiatMode}
              isIndicativeLoading={isIndicativeLoading}
              valueIsIndicative={valueIsIndicative}
              showSoftInputOnFocus={showSoftInputOnFocus}
              resetSelection={resetSelection}
              disabled={disabled}
              tokenColor={tokenColor}
              indicativeQuoteTextDisplay={display}
              showInsufficientBalanceWarning={showInsufficientBalanceWarning}
              showDefaultTokenOptions={showDefaultTokenOptions}
              fontSizeOptions={fontSizeOptions}
              inputRowPaddingVertical={inputRowPaddingVertical}
              minHeight={inputRowMinHeight}
              inputSuffix={inputSuffix}
              hidePresets={hidePresets}
              onPressIn={onPressIn}
              onSelectionChange={selectionChange}
              onSetExactAmount={onSetExactAmount}
              onShowTokenSelector={onShowTokenSelector}
              onPressDisabledWithShakeAnimation={onPressDisabledWithShakeAnimation}
              onBlur={onBlur}
            />
            <Flex
              row
              alignItems="center"
              mb={showPercentagePresetsOnBottom ? '$spacing6' : undefined}
              // maintain layout when balance is hidden
              opacity={currencyInfo ? 1 : 0}
              pointerEvents={currencyInfo ? 'auto' : 'none'}
            >
              {showPercentagePresetsOnBottom && currencyBalance && !currencyAmount ? (
                <Flex position="absolute">
                  <AmountInputPresets hoverLtr presets={PRESET_PERCENTAGES} renderPreset={renderPreset} />
                </Flex>
              ) : (
                <Flex row flex={1} justifyContent="space-between" alignItems="center">
                  <CurrencyInputPanelValue
                    disabled={disabled}
                    value={value}
                    usdValue={usdValue}
                    isFiatMode={isFiatMode}
                    priceDifferencePercentage={priceDifferencePercentage}
                    currencyInfo={currencyInfo}
                    currencyAmount={currencyAmount}
                    currencyField={currencyField}
                    fiatValueVariant={fiatValueVariant}
                    onPressDisabledWithShakeAnimation={onPressDisabledWithShakeAnimation}
                    onToggleIsFiatMode={onToggleIsFiatMode}
                  />
                </Flex>
              )}
              {currencyInfo && (
                <Flex row centered ml="auto" gap="$spacing4" justifyContent="flex-end">
                  <CurrencyInputPanelBalance
                    currencyField={currencyField}
                    currencyBalance={currencyBalance}
                    currencyInfo={currencyInfo}
                    showInsufficientBalanceWarning={showInsufficientBalanceWarning}
                    hideBalance={!!hidePresets}
                  />
                  {/* Max button */}
                  {showMaxButton && onSetPresetValue && (
                    <PresetAmountButton
                      percentage="max"
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
            {panelAccessory ? <Flex mt={panelAccessoryPaddingTop}>{panelAccessory}</Flex> : null}
          </Flex>
        </TouchableArea>
      )
    },
  ),
)

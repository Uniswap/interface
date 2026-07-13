import { isExtensionApp, isMobileWeb, isWebAppDesktop } from '@universe/environment'
//! tamagui-ignore
// tamagui-ignore
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
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'

export const CurrencyInputPanel = memo(
  forwardRef<CurrencyInputPanelRef, CurrencyInputPanelProps>(
    // oxlint-disable-next-line complexity -- long-lived component covering many input modes
    function CurrencyInputPanelInner(props, forwardedRef): JSX.Element {
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
        balanceVariant,
        actualGasFee,
        isGasCovered,
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

      const maxInputAmount = useMaxAmountSpend({
        currencyAmount: currencyBalance,
        txType: transactionType,
        isGasCovered,
      })

      const handlePressBalance = useCallback(() => {
        if (isOutput) {
          // For the output (Buy) panel, set the exact output amount to the balance
          if (currencyBalance && currencyBalance.greaterThan(0)) {
            onSetExactAmount(currencyBalance.toExact())
          }
        } else {
          // For the input (Sell) panel, use max amount which accounts for gas reserves
          if (maxInputAmount && maxInputAmount.greaterThan(0)) {
            handleSetPresetValue(maxInputAmount.toExact(), 'max')
          }
        }
      }, [isOutput, currencyBalance, maxInputAmount, onSetExactAmount, handleSetPresetValue])

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
            actualGasFee={actualGasFee}
            isGasCovered={isGasCovered}
            onSetPresetValue={handleSetPresetValue}
          />
        ),
        [
          currencyAmount,
          currencyBalance,
          currencyField,
          handleSetPresetValue,
          transactionType,
          actualGasFee,
          isGasCovered,
        ],
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
              actualGasFee={actualGasFee}
              isGasCovered={isGasCovered}
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
                    variant={balanceVariant}
                    onPressBalance={
                      !disabled && (isOutput || onSetPresetValue) && currencyBalance?.greaterThan(0)
                        ? handlePressBalance
                        : undefined
                    }
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
                      actualGasFee={actualGasFee}
                      isGasCovered={isGasCovered}
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

/* eslint-disable complexity */
import { forwardRef, memo, useCallback } from 'react'
import { Flex, TouchableArea, useIsShortMobileDevice, useShakeAnimation } from 'ui/src'
import { AmountInputPresets } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { CurrencyInputPanelBalance } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelBalance'
import { CurrencyInputPanelHeader } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelHeader'
import { CurrencyInputPanelInput } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelInput'
import { CurrencyInputPanelValue } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelValue'
import { useIndicativeQuoteTextDisplay } from 'uniswap/src/components/CurrencyInputPanel/hooks/useIndicativeQuoteTextDisplay'
import type { CurrencyInputPanelProps, CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
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
      } = props
      const account = useWallet().evmAccount
      const isShortMobileDevice = useIsShortMobileDevice()

      const display = useIndicativeQuoteTextDisplay(props)
      const { value, usdValue } = display

      const isOutput = currencyField === CurrencyField.OUTPUT

      const showDefaultTokenOptions = isOutput && !currencyInfo

      const showInsufficientBalanceWarning =
        !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

      const showMaxButton = showMaxButtonOnly && !isOutput && account
      const showPercentagePresetOptions = !showMaxButtonOnly && currencyField === CurrencyField.INPUT

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
              onPressIn={onPressIn}
              onSelectionChange={selectionChange}
              onSetExactAmount={onSetExactAmount}
              onShowTokenSelector={onShowTokenSelector}
              onPressDisabledWithShakeAnimation={onPressDisabledWithShakeAnimation}
            />
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
                <CurrencyInputPanelValue
                  disabled={disabled}
                  value={value}
                  usdValue={usdValue}
                  isFiatMode={isFiatMode}
                  priceDifferencePercentage={priceDifferencePercentage}
                  currencyInfo={currencyInfo}
                  currencyAmount={currencyAmount}
                  currencyField={currencyField}
                  onPressDisabledWithShakeAnimation={onPressDisabledWithShakeAnimation}
                  onToggleIsFiatMode={onToggleIsFiatMode}
                />
              )}
              {currencyInfo && (
                <Flex row centered ml="auto" gap="$spacing4" justifyContent="flex-end">
                  <CurrencyInputPanelBalance
                    currencyField={currencyField}
                    currencyBalance={currencyBalance}
                    currencyInfo={currencyInfo}
                    showInsufficientBalanceWarning={showInsufficientBalanceWarning}
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
          </Flex>
        </TouchableArea>
      )
    },
  ),
)

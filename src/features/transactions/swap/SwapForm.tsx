import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, TextInputProps } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { useUSDCPrice, useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import {
  DerivedSwapInfo,
  useShowSwapNetworkNotification,
  useSwapActionHandlers,
} from 'src/features/transactions/swap/hooks'
import { SwapArrowButton } from 'src/features/transactions/swap/SwapArrowButton'
import { isPriceImpactWarning } from 'src/features/transactions/swap/useSwapWarnings'
import {
  getRateToDisplay,
  getReviewActionName,
  isWrapAction,
} from 'src/features/transactions/swap/utils'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { createTransactionId } from 'src/features/transactions/utils'
import { formatPrice, NumberType } from 'src/utils/format'

interface SwapFormProps {
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  derivedSwapInfo: DerivedSwapInfo
  warnings: Warning[]
  exactValue: string
}

export const ARROW_SIZE = 44

export function SwapForm({
  dispatch,
  onNext,
  derivedSwapInfo,
  warnings,
  exactValue,
}: SwapFormProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    chainId,
    currencies,
    currencyAmounts,
    currencyBalances,
    exactCurrencyField,
    focusOnCurrencyField,
    formattedDerivedValue,
    trade,
    wrapType,
  } = derivedSwapInfo

  const {
    onFocusInput,
    onFocusOutput,
    onSwitchCurrencies,
    onSetAmount,
    onSetMax,
    onCreateTxId,
    onShowTokenSelector,
  } = useSwapActionHandlers(dispatch)

  const { showNativeKeyboard, onLayout } = useShouldShowNativeKeyboard()

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const outputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.OUTPUT])

  useShowSwapNetworkNotification(chainId)

  const [showWarningModal, setShowWarningModal] = useState(false)

  const swapDataRefreshing = !isWrapAction(wrapType) && (trade.isFetching || trade.loading)

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade
  const blockingWarning = warnings.some((warning) => warning.action === WarningAction.DisableReview)

  const actionButtonDisabled = noValidSwap || blockingWarning || swapDataRefreshing

  const swapWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)
  const swapWarningColor = getAlertColor(swapWarning?.severity)

  const onSwapWarningClick = () => {
    Keyboard.dismiss()
    setShowWarningModal(true)
  }

  const onReview = () => {
    const txId = createTransactionId()
    onCreateTxId(txId)
    onNext()
  }

  const [inputSelection, setInputSelection] = useState<TextInputProps['selection']>()

  const [outputSelection, setOutputSelection] = useState<TextInputProps['selection']>()
  const selection = useMemo(
    () => ({
      [CurrencyField.INPUT]: inputSelection,
      [CurrencyField.OUTPUT]: outputSelection,
    }),
    [inputSelection, outputSelection]
  )
  const resetSelection = useCallback(
    (start: number, end?: number) => {
      const reset =
        focusOnCurrencyField === CurrencyField.INPUT ? setInputSelection : setOutputSelection
      reset({ start, end: end ?? start })
    },
    [focusOnCurrencyField]
  )

  const [showInverseRate, setShowInverseRate] = useState(false)
  const price = trade.trade?.executionPrice
  const rateUnitPrice = useUSDCPrice(showInverseRate ? price?.quoteCurrency : price?.baseCurrency)
  const showRate = !swapWarning && (trade.trade || swapDataRefreshing)

  return (
    <>
      {showWarningModal && swapWarning?.title && (
        <WarningModal
          isVisible
          caption={swapWarning.message}
          confirmText={t('OK')}
          modalName={ModalName.SwapWarning}
          severity={swapWarning.severity}
          title={swapWarning.title}
          onClose={() => setShowWarningModal(false)}
          onConfirm={() => setShowWarningModal(false)}
        />
      )}
      <Flex fill grow gap="xs" justifyContent="space-between" onLayout={onLayout}>
        <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} gap="xxxs">
          <Trace section={SectionName.CurrencyInputPanel}>
            <Flex backgroundColor="background2" borderRadius="xl" pb="md" pt="lg" px="md">
              <CurrencyInputPanel
                currency={currencies[CurrencyField.INPUT]}
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
                focus={focusOnCurrencyField === CurrencyField.INPUT}
                selection={showNativeKeyboard ? undefined : inputSelection}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={inputCurrencyUSDValue}
                value={
                  exactCurrencyField === CurrencyField.INPUT ? exactValue : formattedDerivedValue
                }
                warnings={warnings}
                onPressIn={showNativeKeyboard ? undefined : onFocusInput}
                onSelectionChange={
                  showNativeKeyboard ? undefined : (start, end) => setInputSelection({ start, end })
                }
                onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value)}
                onSetMax={onSetMax}
                onShowTokenSelector={() => onShowTokenSelector(CurrencyField.INPUT)}
              />
            </Flex>
          </Trace>

          <Box zIndex="popover">
            <Box alignItems="center" height={ARROW_SIZE} style={StyleSheet.absoluteFill}>
              <Box alignItems="center" bottom={ARROW_SIZE / 2} position="absolute">
                <SwapArrowButton bg="background1" onPress={onSwitchCurrencies} />
              </Box>
            </Box>
          </Box>

          <Trace section={SectionName.CurrencyOutputPanel}>
            <Flex fill gap="none">
              <Flex
                backgroundColor="background2"
                borderBottomLeftRadius={swapWarning || showRate ? 'none' : 'xl'}
                borderBottomRightRadius={swapWarning || showRate ? 'none' : 'xl'}
                borderTopLeftRadius="xl"
                borderTopRightRadius="xl"
                gap="none"
                overflow="hidden"
                pb="md"
                position="relative"
                pt="lg"
                px="md">
                <CurrencyInputPanel
                  isOutput
                  currency={currencies[CurrencyField.OUTPUT]}
                  currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                  currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                  dimTextColor={exactCurrencyField === CurrencyField.INPUT && swapDataRefreshing}
                  focus={focusOnCurrencyField === CurrencyField.OUTPUT}
                  selection={showNativeKeyboard ? undefined : outputSelection}
                  showNonZeroBalancesOnly={false}
                  showSoftInputOnFocus={showNativeKeyboard}
                  usdValue={outputCurrencyUSDValue}
                  value={
                    exactCurrencyField === CurrencyField.OUTPUT ? exactValue : formattedDerivedValue
                  }
                  warnings={warnings}
                  onPressIn={showNativeKeyboard ? undefined : onFocusOutput}
                  onSelectionChange={
                    showNativeKeyboard
                      ? undefined
                      : (start, end) => setOutputSelection({ start, end })
                  }
                  onSetAmount={(value) => onSetAmount(CurrencyField.OUTPUT, value)}
                  onShowTokenSelector={() => onShowTokenSelector(CurrencyField.OUTPUT)}
                />
              </Flex>
              {/* TODO: this could use the Button component instead. */}
              {swapWarning && (
                <TouchableArea onPress={onSwapWarningClick}>
                  <Flex
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor={swapWarningColor.background}
                    borderBottomLeftRadius="lg"
                    borderBottomRightRadius="lg"
                    flexGrow={1}
                    gap="xs"
                    px="md"
                    py="sm">
                    <AlertTriangleIcon
                      color={theme.colors[swapWarningColor.text]}
                      height={theme.iconSizes.sm}
                      width={theme.iconSizes.sm}
                    />
                    <Flex row gap="none">
                      <Text color={swapWarningColor.text} variant="subheadSmall">
                        {trade.trade && isPriceImpactWarning(swapWarning)
                          ? getRateToDisplay(trade.trade, showInverseRate)
                          : swapWarning.title}
                      </Text>
                      {isPriceImpactWarning(swapWarning) && (
                        <Text color="textSecondary" variant="bodySmall">
                          {rateUnitPrice &&
                            ` (${formatPrice(rateUnitPrice, NumberType.FiatTokenPrice)})`}
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </TouchableArea>
              )}
              {showRate && (
                <TouchableArea onPress={() => setShowInverseRate(!showInverseRate)}>
                  <Flex
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="background3"
                    borderBottomLeftRadius="lg"
                    borderBottomRightRadius="lg"
                    flexGrow={1}
                    gap="xs"
                    px="md"
                    py="sm">
                    {swapDataRefreshing ? (
                      <SpinningLoader size={theme.iconSizes.md} />
                    ) : (
                      <InfoCircle
                        color={theme.colors.textSecondary}
                        height={theme.iconSizes.md}
                        width={theme.iconSizes.md}
                      />
                    )}
                    <Flex row gap="none">
                      <Text
                        color={swapDataRefreshing ? 'textTertiary' : undefined}
                        variant="subheadSmall">
                        {trade.trade
                          ? getRateToDisplay(trade.trade, showInverseRate)
                          : t('Fetching price...')}
                      </Text>
                      <Text
                        color={swapDataRefreshing ? 'textTertiary' : 'textSecondary'}
                        variant="bodySmall">
                        {rateUnitPrice &&
                          ` (${formatPrice(rateUnitPrice, NumberType.FiatTokenPrice)})`}
                      </Text>
                    </Flex>
                  </Flex>
                </TouchableArea>
              )}
            </Flex>
          </Trace>
        </AnimatedFlex>
        <AnimatedFlex exiting={FadeOutDown} gap="xs">
          {!showNativeKeyboard && (
            <DecimalPad
              resetSelection={resetSelection}
              selection={selection[focusOnCurrencyField]}
              setValue={(value: string) => onSetAmount(focusOnCurrencyField, value)}
              value={
                focusOnCurrencyField === exactCurrencyField ? exactValue : formattedDerivedValue
              }
            />
          )}
          <Button
            disabled={actionButtonDisabled}
            label={getReviewActionName(t, wrapType)}
            name={ElementName.ReviewSwap}
            size={ButtonSize.Large}
            onPress={onReview}
          />
        </AnimatedFlex>
      </Flex>
    </>
  )
}

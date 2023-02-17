// TODO(MOB-3866): reduce component complexity
/* eslint-disable complexity */
import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, TextInputProps } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import InfoCircle from 'src/assets/icons/info.svg'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { useUSDCPrice, useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import { useSwapAnalytics } from 'src/features/transactions/swap/analytics'
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
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useIsBlockedActiveAddress } from 'src/features/trm/hooks'
import { formatCurrencyAmount, formatPrice, NumberType } from 'src/utils/format'

interface SwapFormProps {
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  derivedSwapInfo: DerivedSwapInfo
  warnings: Warning[]
  exactValue: string
  showingSelectorScreen: boolean
}

function _SwapForm({
  dispatch,
  onNext,
  derivedSwapInfo,
  warnings,
  exactValue,
  showingSelectorScreen,
}: SwapFormProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    chainId,
    currencies,
    currencyAmounts,
    currencyBalances,
    exactCurrencyField,
    focusOnCurrencyField,
    trade,
    wrapType,
  } = derivedSwapInfo

  const {
    onFocusInput,
    onFocusOutput,
    onSwitchCurrencies,
    onSetExactAmount,
    onSetMax,
    onCreateTxId,
    onShowTokenSelector,
  } = useSwapActionHandlers(dispatch)

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const outputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.OUTPUT])

  useShowSwapNetworkNotification(chainId)

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const [showWarningModal, setShowWarningModal] = useState(false)

  const swapDataRefreshing = !isWrapAction(wrapType) && (trade.isFetching || trade.loading)

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade
  const blockingWarning = warnings.some((warning) => warning.action === WarningAction.DisableReview)

  const actionButtonDisabled =
    noValidSwap || blockingWarning || swapDataRefreshing || isBlocked || isBlockedLoading

  const swapWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Low)
  const swapWarningColor = getAlertColor(swapWarning?.severity)

  const onSwapWarningClick = (): void => {
    Keyboard.dismiss()
    setShowWarningModal(true)
  }

  const onReview = useCallback((): void => {
    const txId = createTransactionId()
    onCreateTxId(txId)
    onNext()
  }, [onCreateTxId, onNext])

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
      if (focusOnCurrencyField === CurrencyField.INPUT) {
        setInputSelection({ start, end: end ?? start })
      } else if (focusOnCurrencyField === CurrencyField.OUTPUT) {
        setOutputSelection({ start, end: end ?? start })
      }
    },
    [focusOnCurrencyField]
  )

  const [showInverseRate, setShowInverseRate] = useState(false)
  const price = trade.trade?.executionPrice
  const rateUnitPrice = useUSDCPrice(showInverseRate ? price?.quoteCurrency : price?.baseCurrency)
  const showRate = !swapWarning && (trade.trade || swapDataRefreshing)

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
  const formattedDerivedValue = formatCurrencyAmount(
    currencyAmounts[derivedCurrencyField],
    NumberType.SwapTradeAmount,
    ''
  )

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const SWAP_DIRECTION_BUTTON_SIZE = theme.iconSizes.icon20
  const SWAP_DIRECTION_BUTTON_INNER_PADDING = theme.spacing.spacing8 + theme.spacing.spacing2
  const SWAP_DIRECTION_BUTTON_BORDER_WIDTH = theme.spacing.spacing4

  useSwapAnalytics(derivedSwapInfo)
  const SwapWarningIcon = swapWarning?.icon ?? AlertTriangleIcon

  const setValue = useCallback(
    (value: string): void => {
      if (!focusOnCurrencyField) return
      onSetExactAmount(focusOnCurrencyField, value)
    },

    [focusOnCurrencyField, onSetExactAmount]
  )

  const onInputSelectionChange = useCallback((start, end) => setInputSelection({ start, end }), [])
  const onOutputSelectionChange = useCallback(
    (start, end) => setOutputSelection({ start, end }),
    []
  )

  const onSetExactAmountInput = useCallback(
    (value): void => onSetExactAmount(CurrencyField.INPUT, value),
    [onSetExactAmount]
  )

  const onSetExactAmountOutput = useCallback(
    (value): void => onSetExactAmount(CurrencyField.OUTPUT, value),
    [onSetExactAmount]
  )

  const onShowTokenSelectorInput = useCallback(
    (): void => onShowTokenSelector(CurrencyField.INPUT),
    [onShowTokenSelector]
  )

  const onShowTokenSelectorOutput = useCallback(
    (): void => onShowTokenSelector(CurrencyField.OUTPUT),
    [onShowTokenSelector]
  )

  return (
    <>
      {showWarningModal && swapWarning?.title && (
        <WarningModal
          caption={swapWarning.message}
          confirmText={t('Close')}
          icon={
            <SwapWarningIcon
              color={theme.colors[swapWarningColor.text]}
              height={theme.iconSizes.icon24}
              width={theme.iconSizes.icon24}
            />
          }
          modalName={ModalName.SwapWarning}
          severity={swapWarning.severity}
          title={swapWarning.title}
          onClose={(): void => setShowWarningModal(false)}
          onConfirm={(): void => setShowWarningModal(false)}
        />
      )}
      <Flex grow gap="spacing8" justifyContent="space-between">
        <AnimatedFlex
          entering={FadeIn}
          exiting={FadeOut}
          gap="spacing2"
          onLayout={onInputPanelLayout}>
          <Trace section={SectionName.CurrencyInputPanel}>
            <Flex backgroundColor="background2" borderRadius="rounded20">
              <CurrencyInputPanel
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyInfo={currencies[CurrencyField.INPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
                focus={focusOnCurrencyField === CurrencyField.INPUT}
                isOnScreen={!showingSelectorScreen}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={inputCurrencyUSDValue}
                value={
                  exactCurrencyField === CurrencyField.INPUT ? exactValue : formattedDerivedValue
                }
                warnings={warnings}
                onPressIn={onFocusInput}
                onSelectionChange={showNativeKeyboard ? undefined : onInputSelectionChange}
                onSetExactAmount={onSetExactAmountInput}
                onSetMax={onSetMax}
                onShowTokenSelector={onShowTokenSelectorInput}
              />
            </Flex>
          </Trace>

          <Box zIndex="popover">
            <Box alignItems="center" height={0} style={StyleSheet.absoluteFill}>
              <Box
                alignItems="center"
                bottom={
                  -(
                    // (icon size + (top + bottom padding) + (top + bottom border)) / 2
                    // to center the swap direction button vertically
                    (
                      SWAP_DIRECTION_BUTTON_SIZE +
                      SWAP_DIRECTION_BUTTON_INNER_PADDING * 2 +
                      SWAP_DIRECTION_BUTTON_BORDER_WIDTH * 2
                    )
                  ) / 2
                }
                position="absolute">
                <SwapArrowButton
                  bg="background2"
                  size={SWAP_DIRECTION_BUTTON_SIZE}
                  onPress={onSwitchCurrencies}
                />
              </Box>
            </Box>
          </Box>

          <Trace section={SectionName.CurrencyOutputPanel}>
            <Box>
              <Flex
                backgroundColor="background2"
                borderBottomLeftRadius={swapWarning || showRate || isBlocked ? 'none' : 'rounded20'}
                borderBottomRightRadius={
                  swapWarning || showRate || isBlocked ? 'none' : 'rounded20'
                }
                borderTopLeftRadius="rounded20"
                borderTopRightRadius="rounded20"
                gap="none"
                overflow="hidden"
                position="relative">
                <CurrencyInputPanel
                  isOutput
                  currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                  currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                  currencyInfo={currencies[CurrencyField.OUTPUT]}
                  dimTextColor={exactCurrencyField === CurrencyField.INPUT && swapDataRefreshing}
                  focus={focusOnCurrencyField === CurrencyField.OUTPUT}
                  isOnScreen={!showingSelectorScreen}
                  showNonZeroBalancesOnly={false}
                  showSoftInputOnFocus={showNativeKeyboard}
                  usdValue={outputCurrencyUSDValue}
                  value={
                    exactCurrencyField === CurrencyField.OUTPUT ? exactValue : formattedDerivedValue
                  }
                  warnings={warnings}
                  onPressIn={onFocusOutput}
                  onSelectionChange={showNativeKeyboard ? undefined : onOutputSelectionChange}
                  onSetExactAmount={onSetExactAmountOutput}
                  onShowTokenSelector={onShowTokenSelectorOutput}
                />
              </Flex>
              {swapWarning && !isBlocked ? (
                <TouchableArea mt="spacing1" onPress={onSwapWarningClick}>
                  <Flex
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="background2"
                    borderBottomLeftRadius="rounded16"
                    borderBottomRightRadius="rounded16"
                    flexGrow={1}
                    gap="spacing8"
                    px="spacing16"
                    py="spacing12">
                    <SwapWarningIcon
                      color={theme.colors[swapWarningColor.text]}
                      height={theme.iconSizes.icon16}
                      strokeWidth={1.5}
                      width={theme.iconSizes.icon16}
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
              ) : null}
              {isBlocked && (
                <BlockedAddressWarning
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor="background2"
                  borderBottomLeftRadius="rounded16"
                  borderBottomRightRadius="rounded16"
                  flexGrow={1}
                  mt="spacing2"
                  px="spacing16"
                  py="spacing12"
                />
              )}
              {showRate && !isBlocked ? (
                <TouchableArea onPress={(): void => setShowInverseRate(!showInverseRate)}>
                  <Flex
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="background2"
                    borderBottomLeftRadius="rounded16"
                    borderBottomRightRadius="rounded16"
                    borderTopColor="background0"
                    borderTopWidth={1}
                    flexGrow={1}
                    gap="spacing8"
                    px="spacing12"
                    py="spacing12">
                    {swapDataRefreshing ? (
                      <SpinningLoader size={theme.iconSizes.icon20} />
                    ) : (
                      <InfoCircle
                        color={theme.colors.textPrimary}
                        height={theme.iconSizes.icon20}
                        width={theme.iconSizes.icon20}
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
                        variant="subheadSmall">
                        {rateUnitPrice &&
                          ` (${formatPrice(rateUnitPrice, NumberType.FiatTokenPrice)})`}
                      </Text>
                    </Flex>
                  </Flex>
                </TouchableArea>
              ) : null}
            </Box>
          </Trace>
        </AnimatedFlex>
        <AnimatedFlex
          bottom={0}
          exiting={FadeOutDown}
          gap="spacing8"
          left={0}
          opacity={isLayoutPending ? 0 : 1}
          position="absolute"
          right={0}
          onLayout={onDecimalPadLayout}>
          {!showNativeKeyboard && (
            <DecimalPad
              resetSelection={resetSelection}
              selection={focusOnCurrencyField ? selection[focusOnCurrencyField] : undefined}
              setValue={setValue}
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

export const SwapForm = memo(_SwapForm)

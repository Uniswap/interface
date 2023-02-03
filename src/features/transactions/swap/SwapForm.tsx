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

  const onReview = (): void => {
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

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
  const formattedDerivedValue = formatCurrencyAmount(
    currencyAmounts[derivedCurrencyField],
    NumberType.SwapTradeAmount,
    ''
  )

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const SWAP_DIRECTION_BUTTON_SIZE = theme.iconSizes.md
  const SWAP_DIRECTION_BUTTON_INNER_PADDING = theme.spacing.xs + theme.spacing.xxxs
  const SWAP_DIRECTION_BUTTON_BORDER_WIDTH = theme.spacing.xxs

  useSwapAnalytics(derivedSwapInfo)
  const SwapWarningIcon = swapWarning?.icon ?? AlertTriangleIcon

  return (
    <>
      {showWarningModal && swapWarning?.title && (
        <WarningModal
          caption={swapWarning.message}
          confirmText={t('Close')}
          icon={
            <SwapWarningIcon
              color={theme.colors[swapWarningColor.text]}
              height={theme.iconSizes.lg}
              width={theme.iconSizes.lg}
            />
          }
          modalName={ModalName.SwapWarning}
          severity={swapWarning.severity}
          title={swapWarning.title}
          onClose={(): void => setShowWarningModal(false)}
          onConfirm={(): void => setShowWarningModal(false)}
        />
      )}
      <Flex grow gap="xs" justifyContent="space-between">
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xxxs" onLayout={onInputPanelLayout}>
          <Trace section={SectionName.CurrencyInputPanel}>
            <Flex backgroundColor="background2" borderRadius="xl">
              <CurrencyInputPanel
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyInfo={currencies[CurrencyField.INPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
                focus={focusOnCurrencyField === CurrencyField.INPUT}
                isOnScreen={!showingSelectorScreen}
                selection={showNativeKeyboard ? undefined : inputSelection}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={inputCurrencyUSDValue}
                value={
                  exactCurrencyField === CurrencyField.INPUT ? exactValue : formattedDerivedValue
                }
                warnings={warnings}
                onPressIn={onFocusInput}
                onSelectionChange={
                  showNativeKeyboard
                    ? undefined
                    : (start, end): void => setInputSelection({ start, end })
                }
                onSetExactAmount={(value): void => onSetExactAmount(CurrencyField.INPUT, value)}
                onSetMax={onSetMax}
                onShowTokenSelector={(): void => onShowTokenSelector(CurrencyField.INPUT)}
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
                borderBottomLeftRadius={swapWarning || showRate || isBlocked ? 'none' : 'xl'}
                borderBottomRightRadius={swapWarning || showRate || isBlocked ? 'none' : 'xl'}
                borderTopLeftRadius="xl"
                borderTopRightRadius="xl"
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
                  selection={showNativeKeyboard ? undefined : outputSelection}
                  showNonZeroBalancesOnly={false}
                  showSoftInputOnFocus={showNativeKeyboard}
                  usdValue={outputCurrencyUSDValue}
                  value={
                    exactCurrencyField === CurrencyField.OUTPUT ? exactValue : formattedDerivedValue
                  }
                  warnings={warnings}
                  onPressIn={onFocusOutput}
                  onSelectionChange={
                    showNativeKeyboard
                      ? undefined
                      : (start, end): void => setOutputSelection({ start, end })
                  }
                  onSetExactAmount={(value): void => onSetExactAmount(CurrencyField.OUTPUT, value)}
                  onShowTokenSelector={(): void => onShowTokenSelector(CurrencyField.OUTPUT)}
                />
              </Flex>
              {swapWarning && !isBlocked ? (
                <TouchableArea mt="xxxxs" onPress={onSwapWarningClick}>
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
                    <SwapWarningIcon
                      color={theme.colors[swapWarningColor.text]}
                      height={theme.iconSizes.sm}
                      strokeWidth={1.5}
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
              ) : null}
              {isBlocked && (
                <BlockedAddressWarning
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor="background2"
                  borderBottomLeftRadius="lg"
                  borderBottomRightRadius="lg"
                  flexGrow={1}
                  mt="xxxs"
                  px="md"
                  py="sm"
                />
              )}
              {showRate && !isBlocked ? (
                <TouchableArea onPress={(): void => setShowInverseRate(!showInverseRate)}>
                  <Flex
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="background2"
                    borderBottomLeftRadius="lg"
                    borderBottomRightRadius="lg"
                    borderTopColor="background0"
                    borderTopWidth={1}
                    flexGrow={1}
                    gap="xs"
                    px="md"
                    py="sm">
                    {swapDataRefreshing ? (
                      <SpinningLoader size={theme.iconSizes.sm} />
                    ) : (
                      <InfoCircle
                        color={theme.colors.textSecondary}
                        height={theme.iconSizes.sm}
                        width={theme.iconSizes.sm}
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
              ) : null}
            </Box>
          </Trace>
        </AnimatedFlex>
        <AnimatedFlex
          bottom={0}
          exiting={FadeOutDown}
          gap="xs"
          left={0}
          opacity={isLayoutPending ? 0 : 1}
          position="absolute"
          right={0}
          onLayout={onDecimalPadLayout}>
          {!showNativeKeyboard && (
            <DecimalPad
              resetSelection={resetSelection}
              selection={selection[focusOnCurrencyField]}
              setValue={(value: string): void => onSetExactAmount(focusOnCurrencyField, value)}
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

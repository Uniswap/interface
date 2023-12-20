// TODO(MOB-203): reduce component complexity
/* eslint-disable complexity */
import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, TextInputProps } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useShouldShowNativeKeyboard } from 'src/app/hooks'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { TokenSelectorFlow } from 'src/components/TokenSelector/types'
import Trace from 'src/components/Trace/Trace'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import {
  useTokenFormActionHandlers,
  useTokenSelectorActionHandlers,
} from 'src/features/transactions/hooks'
import { useSwapAnalytics } from 'src/features/transactions/swap/analytics'
import { useShowSwapNetworkNotification } from 'src/features/transactions/swap/hooks'
import { SwapArrowButton } from 'src/features/transactions/swap/SwapArrowButton'
import { isPriceImpactWarning } from 'src/features/transactions/swap/useSwapWarnings'
import { getRateToDisplay, isWrapAction } from 'src/features/transactions/swap/utils'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { AnimatedFlex, Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import InfoCircleFilled from 'ui/src/assets/icons/info-circle-filled.svg'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { iconSizes, spacing } from 'ui/src/theme'
// eslint-disable-next-line no-restricted-imports
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useUSDCPrice } from 'wallet/src/features/routing/useUSDCPrice'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { DerivedSwapInfo } from './types'

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
  const colors = useSporeColors()

  const formatter = useLocalizationContext()
  const { convertFiatAmountFormatted } = formatter

  const {
    chainId,
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
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
  } = useTokenFormActionHandlers(dispatch)
  const { onShowTokenSelector } = useTokenSelectorActionHandlers(dispatch, TokenSelectorFlow.Swap)

  useShowSwapNetworkNotification(chainId)

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const onRestorePress = (): void => {
    Keyboard.dismiss()
    openWalletRestoreModal()
  }

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const [showWarningModal, setShowWarningModal] = useState(false)

  const swapDataRefreshing = !isWrapAction(wrapType) && (trade.isFetching || trade.loading)

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade
  const blockingWarning = warnings.some((warning) => warning.action === WarningAction.DisableReview)

  const actionButtonDisabled =
    noValidSwap ||
    blockingWarning ||
    swapDataRefreshing ||
    isBlocked ||
    isBlockedLoading ||
    walletNeedsRestore

  // We clear swap warnings while refreshing in order to show the loading indicator
  const swapWarning = swapDataRefreshing
    ? null
    : warnings.find((warning) => warning.severity >= WarningSeverity.Low)
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
  const rateUnitPriceFormatted = convertFiatAmountFormatted(
    rateUnitPrice?.toSignificant(),
    NumberType.FiatTokenPrice
  )
  const showRate = !swapWarning && (trade.trade || swapDataRefreshing)

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
  // TODO gary MOB-2028 replace temporary hack to handle different separators
  // Replace with localized version of formatter
  const formattedDerivedValue = formatCurrencyAmount({
    amount: currencyAmounts[derivedCurrencyField],
    locale: 'en-US',
    type: NumberType.SwapTradeAmount,
    placeholder: '',
  })

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const SWAP_DIRECTION_BUTTON_SIZE = iconSizes.icon20
  const SWAP_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing8 + spacing.spacing2
  const SWAP_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4

  useSwapAnalytics(derivedSwapInfo)
  const SwapWarningIcon = swapWarning?.icon ?? Icons.AlertTriangle

  const setValue = useCallback(
    (value: string): void => {
      if (!focusOnCurrencyField) return
      onSetExactAmount(focusOnCurrencyField, value)
    },

    [focusOnCurrencyField, onSetExactAmount]
  )

  const onInputSelectionChange = useCallback(
    (start: number, end: number) => setInputSelection({ start, end }),
    []
  )
  const onOutputSelectionChange = useCallback(
    (start: number, end: number) => setOutputSelection({ start, end }),
    []
  )

  const onSetExactAmountInput = useCallback(
    (value: string): void => onSetExactAmount(CurrencyField.INPUT, value),
    [onSetExactAmount]
  )

  const onSetExactAmountOutput = useCallback(
    (value: string): void => onSetExactAmount(CurrencyField.OUTPUT, value),
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
              color={swapWarningColor.text}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          }
          modalName={ModalName.SwapWarning}
          severity={swapWarning.severity}
          title={swapWarning.title}
          onClose={(): void => setShowWarningModal(false)}
          onConfirm={(): void => setShowWarningModal(false)}
        />
      )}
      <Flex grow gap="$spacing8" justifyContent="space-between">
        <AnimatedFlex
          entering={FadeIn}
          exiting={FadeOut}
          gap="$spacing2"
          onLayout={onInputPanelLayout}>
          <Trace section={SectionName.CurrencyInputPanel}>
            <Flex backgroundColor="$surface2" borderRadius="$rounded20">
              <CurrencyInputPanel
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyInfo={currencies[CurrencyField.INPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
                focus={focusOnCurrencyField === CurrencyField.INPUT}
                isOnScreen={!showingSelectorScreen}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={currencyAmountsUSDValue[CurrencyField.INPUT]}
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
          <Flex zIndex="$popover">
            <Flex alignItems="center" height={0} style={StyleSheet.absoluteFill}>
              <Flex
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
                <Trace logPress element={ElementName.SwitchCurrenciesButton}>
                  <SwapArrowButton
                    bg="$surface2"
                    size={SWAP_DIRECTION_BUTTON_SIZE}
                    onPress={onSwitchCurrencies}
                  />
                </Trace>
              </Flex>
            </Flex>
          </Flex>
          <Trace section={SectionName.CurrencyOutputPanel}>
            <Flex>
              <Flex
                backgroundColor="$surface2"
                borderBottomLeftRadius={
                  swapWarning || showRate || isBlocked ? '$none' : '$rounded20'
                }
                borderBottomRightRadius={
                  swapWarning || showRate || isBlocked ? '$none' : '$rounded20'
                }
                borderTopLeftRadius="$rounded20"
                borderTopRightRadius="$rounded20"
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
                  usdValue={currencyAmountsUSDValue[CurrencyField.OUTPUT]}
                  value={
                    exactCurrencyField === CurrencyField.OUTPUT ? exactValue : formattedDerivedValue
                  }
                  warnings={warnings}
                  onPressIn={onFocusOutput}
                  onSelectionChange={showNativeKeyboard ? undefined : onOutputSelectionChange}
                  onSetExactAmount={onSetExactAmountOutput}
                  onShowTokenSelector={onShowTokenSelectorOutput}
                />
                {walletNeedsRestore && (
                  <TouchableArea onPress={onRestorePress}>
                    <Flex
                      grow
                      row
                      alignItems="center"
                      alignSelf="stretch"
                      backgroundColor="$surface2"
                      borderBottomLeftRadius="$rounded16"
                      borderBottomRightRadius="$rounded16"
                      borderTopColor="$surface1"
                      borderTopWidth={1}
                      gap="$spacing8"
                      px="$spacing12"
                      py="$spacing12">
                      <InfoCircleFilled
                        color={colors.DEP_accentWarning.val}
                        height={iconSizes.icon20}
                        width={iconSizes.icon20}
                      />
                      <Text color="$DEP_accentWarning" variant="subheading2">
                        {t('Restore your wallet to swap')}
                      </Text>
                    </Flex>
                  </TouchableArea>
                )}
              </Flex>
              {swapWarning && !isBlocked ? (
                <TouchableArea mt="$spacing1" onPress={onSwapWarningClick}>
                  <Flex
                    grow
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="$surface2"
                    borderBottomLeftRadius="$rounded16"
                    borderBottomRightRadius="$rounded16"
                    gap="$spacing8"
                    px="$spacing16"
                    py="$spacing12">
                    <SwapWarningIcon
                      color={swapWarningColor.text}
                      height={iconSizes.icon16}
                      strokeWidth={1.5}
                      width={iconSizes.icon16}
                    />
                    <Flex row>
                      <Text color={swapWarningColor.text} variant="subheading2">
                        {trade.trade && isPriceImpactWarning(swapWarning)
                          ? getRateToDisplay(formatter, trade.trade, showInverseRate)
                          : swapWarning.title}
                      </Text>
                      {isPriceImpactWarning(swapWarning) && (
                        <Text color="$neutral2" variant="body2">
                          {rateUnitPrice && ` (${rateUnitPriceFormatted})`}
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </TouchableArea>
              ) : null}
              {isBlocked && (
                <BlockedAddressWarning
                  grow
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor="$surface2"
                  borderBottomLeftRadius="$rounded16"
                  borderBottomRightRadius="$rounded16"
                  mt="$spacing2"
                  px="$spacing16"
                  py="$spacing12"
                />
              )}
              {showRate && !isBlocked ? (
                <TouchableArea onPress={(): void => setShowInverseRate(!showInverseRate)}>
                  <Flex
                    grow
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="$surface2"
                    borderBottomLeftRadius="$rounded16"
                    borderBottomRightRadius="$rounded16"
                    borderTopColor="$surface1"
                    borderTopWidth={1}
                    gap="$spacing8"
                    px="$spacing12"
                    py="$spacing12">
                    {swapDataRefreshing ? (
                      <SpinningLoader size={iconSizes.icon20} />
                    ) : (
                      <InfoCircle
                        color={colors.neutral1.get()}
                        height={iconSizes.icon20}
                        width={iconSizes.icon20}
                      />
                    )}
                    <Flex row>
                      <Text
                        color={swapDataRefreshing ? '$neutral3' : '$neutral2'}
                        variant="subheading2">
                        {trade.trade
                          ? getRateToDisplay(formatter, trade.trade, showInverseRate)
                          : t('Fetching price...')}
                      </Text>
                      <Text
                        color={swapDataRefreshing ? '$neutral3' : '$neutral2'}
                        variant="subheading2">
                        {rateUnitPrice && ` (${rateUnitPriceFormatted})`}
                      </Text>
                    </Flex>
                  </Flex>
                </TouchableArea>
              ) : null}
            </Flex>
          </Trace>
        </AnimatedFlex>
        <AnimatedFlex
          bottom={0}
          exiting={FadeOutDown}
          gap="$spacing8"
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
          <Trace logPress element={ElementName.SwapReview}>
            <Button
              disabled={actionButtonDisabled}
              size="large"
              testID={ElementName.ReviewSwap}
              onPress={onReview}>
              {t('Review')}
            </Button>
          </Trace>
        </AnimatedFlex>
      </Flex>
    </>
  )
}

export const SwapForm = memo(_SwapForm)

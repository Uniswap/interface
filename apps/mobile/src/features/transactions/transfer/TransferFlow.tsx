import { providers } from 'ethers'
import { default as React, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutAnimation, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useShouldShowNativeKeyboard } from 'src/app/hooks'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { Screen } from 'src/components/layout/Screen'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { TransferHeader } from 'src/features/transactions/transfer/TransferHeader'
import { TransferStatus } from 'src/features/transactions/transfer/TransferStatus'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { Flex, useDeviceInsets, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes } from 'ui/src/theme'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField, TransactionState } from 'uniswap/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import {
  useAddToSearchHistory,
  useCommonTokensOptions,
  useFavoriteTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useTokenSectionsForEmptySearch,
  useTokenSectionsForSearchResults,
} from 'wallet/src/components/TokenSelector/hooks'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useTokenWarningDismissed } from 'wallet/src/features/tokens/safetyHooks'
import { WarningAction, WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { useParsedSendWarnings } from 'wallet/src/features/transactions/hooks/useParsedTransactionWarnings'
import { useTokenSelectorActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenSelectorActionHandlers'
import { useTransactionGasWarning } from 'wallet/src/features/transactions/hooks/useTransactionGasWarning'
import {
  INITIAL_TRANSACTION_STATE,
  transactionStateReducer,
} from 'wallet/src/features/transactions/transactionState/transactionState'
import { TransferReview } from 'wallet/src/features/transactions/transfer/TransferReview'
import { TransferTokenForm } from 'wallet/src/features/transactions/transfer/TransferTokenForm'
import { useDerivedTransferInfo } from 'wallet/src/features/transactions/transfer/hooks/useDerivedTransferInfo'
import { useOnSelectRecipient } from 'wallet/src/features/transactions/transfer/hooks/useOnSelectRecipient'
import { useSetShowRecipientSelector } from 'wallet/src/features/transactions/transfer/hooks/useOnToggleShowRecipientSelector'
import {
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'wallet/src/features/transactions/transfer/hooks/useTransferCallback'
import { useTransferTransactionRequest } from 'wallet/src/features/transactions/transfer/hooks/useTransferTransactionRequest'
import { useTransferWarnings } from 'wallet/src/features/transactions/transfer/hooks/useTransferWarnings'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
import { TransactionStep, TransferFlowProps } from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface TransferFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

export function TransferFlow({ prefilledState, onClose }: TransferFormProps): JSX.Element {
  const insets = useDeviceInsets()
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const { isSheetReady } = useBottomSheetContext()
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { navigateToBuyOrReceiveWithEmptyWallet } = useWalletNavigation()
  const { registerSearch } = useAddToSearchHistory()

  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || INITIAL_TRANSACTION_STATE)
  const derivedTransferInfo = useDerivedTransferInfo(state)
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)

  const { isFiatInput, exactAmountToken, exactAmountFiat } = derivedTransferInfo
  const { showRecipientSelector } = state

  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const onSelectRecipient = useOnSelectRecipient(dispatch)
  const onSetShowRecipientSelector = useSetShowRecipientSelector(dispatch)

  const onHideRecipientSelector = useCallback(() => {
    onSetShowRecipientSelector(false)
  }, [onSetShowRecipientSelector])

  const txRequest = useTransferTransactionRequest(derivedTransferInfo)
  const warnings = useTransferWarnings(t, derivedTransferInfo)
  const gasFee = useTransactionGasFee(
    txRequest,
    GasSpeed.Urgent,
    // stop polling for gas once transaction is submitted
    step === TransactionStep.SUBMITTED || warnings.some((warning) => warning.action === WarningAction.DisableReview),
  )

  const transferTxWithGasSettings = useMemo(
    (): providers.TransactionRequest => ({ ...txRequest, ...gasFee.params }),
    [gasFee.params, txRequest],
  )

  const gasWarning = useTransactionGasWarning({
    derivedInfo: derivedTransferInfo,
    gasFee: gasFee?.value,
  })

  const allWarnings = useMemo(() => {
    return !gasWarning ? warnings : [...warnings, gasWarning]
  }, [warnings, gasWarning])

  const parsedSendWarnings = useParsedSendWarnings(allWarnings)

  const { onSelectCurrency, onHideTokenSelector } = useTokenSelectorActionHandlers(dispatch, TokenSelectorFlow.Transfer)

  // optimization for not rendering InnerContent initially,
  // when modal is opened with recipient or token selector presented
  const [renderInnerContentRouter, setRenderInnerContentRouter] = useState(!showRecipientSelector)
  useEffect(() => {
    setRenderInnerContentRouter(renderInnerContentRouter || !showRecipientSelector)
  }, [renderInnerContentRouter, showRecipientSelector])

  const onFormNext = useCallback(() => setStep(TransactionStep.REVIEW), [setStep])
  const onReviewNext = useCallback(() => setStep(TransactionStep.SUBMITTED), [setStep])
  const onReviewPrev = useCallback(() => setStep(TransactionStep.FORM), [setStep])
  const onRetrySubmit = useCallback(() => setStep(TransactionStep.FORM), [setStep])

  const exactValue = isFiatInput ? exactAmountFiat : exactAmountToken
  const recipient = state.recipient

  const isRecipientScreenOnLeft = useSharedValue(true)
  const inputScreenOffsetX = useSharedValue(0)

  useEffect(() => {
    if (!recipient) {
      // If starting from the recipient selector screen, move the input to the right
      inputScreenOffsetX.value = fullWidth
      return
    }

    if (!showRecipientSelector) {
      // Transition input screen to the center if recipient selector is not shown
      inputScreenOffsetX.value = withTiming(0, undefined, () => {
        isRecipientScreenOnLeft.value = false
      })
    } else {
      // Transition input screen to the left if recipient selector is shown
      // and recipient is already selected
      inputScreenOffsetX.value = withTiming(-fullWidth)
    }
  }, [showRecipientSelector, recipient, fullWidth, inputScreenOffsetX, isRecipientScreenOnLeft])

  const recipientScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: inputScreenOffsetX.value + (isRecipientScreenOnLeft.value ? -1 : 1) * fullWidth,
      },
    ],
  }))

  const inputScreenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputScreenOffsetX.value }],
  }))

  return (
    <>
      <TouchableWithoutFeedback>
        <Screen edges={['top']}>
          <HandleBar backgroundColor="none" />
          <Flex fill>
            <Animated.View style={[styles.screen, recipientScreenStyle]}>
              <RecipientSelect
                focusInput={showRecipientSelector}
                recipient={recipient}
                onHideRecipientSelector={onHideRecipientSelector}
                onSelectRecipient={onSelectRecipient}
              />
            </Animated.View>

            <Animated.View style={[styles.screen, inputScreenStyle]}>
              {/* Padding bottom must have a similar size to the handlebar
              height as 100% height doesn't include the handlebar height */}
              <Flex fill gap="$spacing16" mb={insets.bottom} pb="$spacing12" px="$spacing16">
                {step !== TransactionStep.SUBMITTED && (
                  <TransferHeader flowName={t('send.title')} setShowViewOnlyModal={setShowViewOnlyModal} />
                )}
                {renderInnerContentRouter && isSheetReady && (
                  <TransferInnerContent
                    derivedInfo={derivedTransferInfo}
                    derivedTransferInfo={derivedTransferInfo}
                    dispatch={dispatch}
                    exactValue={exactValue}
                    gasFee={gasFee}
                    setShowViewOnlyModal={setShowViewOnlyModal}
                    setStep={setStep}
                    showingSelectorScreen={!!showRecipientSelector}
                    step={step}
                    txRequest={transferTxWithGasSettings}
                    warnings={parsedSendWarnings}
                    onClose={onClose}
                    onFormNext={onFormNext}
                    onRetrySubmit={onRetrySubmit}
                    onReviewNext={onReviewNext}
                    onReviewPrev={onReviewPrev}
                  />
                )}
              </Flex>
            </Animated.View>

            {showViewOnlyModal && (
              <WarningModal
                caption={t('send.warning.viewOnly.message')}
                confirmText={t('common.button.dismiss')}
                icon={<EyeIcon color={colors.neutral2.get()} height={iconSizes.icon24} width={iconSizes.icon24} />}
                modalName={ModalName.SwapWarning}
                severity={WarningSeverity.Low}
                title={t('send.warning.viewOnly.title')}
                onClose={(): void => setShowViewOnlyModal(false)}
                onConfirm={(): void => setShowViewOnlyModal(false)}
              />
            )}
          </Flex>
        </Screen>
      </TouchableWithoutFeedback>
      {!!state.selectingCurrencyField && (
        <TokenSelectorModal
          activeAccountAddress={activeAccountAddress}
          addToSearchHistoryCallback={registerSearch}
          convertFiatAmountFormattedCallback={convertFiatAmountFormatted}
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Transfer}
          formatNumberOrStringCallback={formatNumberOrString}
          navigateToBuyOrReceiveWithEmptyWalletCallback={navigateToBuyOrReceiveWithEmptyWallet}
          useCommonTokensOptionsHook={useCommonTokensOptions}
          useFavoriteTokensOptionsHook={useFavoriteTokensOptions}
          useFilterCallbacksHook={useFilterCallbacks}
          usePopularTokensOptionsHook={usePopularTokensOptions}
          usePortfolioTokenOptionsHook={usePortfolioTokenOptions}
          useTokenSectionsForEmptySearchHook={useTokenSectionsForEmptySearch}
          useTokenSectionsForSearchResultsHook={useTokenSectionsForSearchResults}
          useTokenWarningDismissedHook={useTokenWarningDismissed}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onDismiss={() => Keyboard.dismiss()}
          onPressAnimation={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </>
  )
}

type TransferInnerContentProps = {
  step: number
  setStep: (step: TransactionStep) => void
  showingSelectorScreen: boolean
  gasFee: GasFeeResult
  derivedTransferInfo: DerivedTransferInfo
  onFormNext: () => void
  onReviewNext: () => void
  onReviewPrev: () => void
  onRetrySubmit: () => void
  setShowViewOnlyModal: (show: boolean) => void
} & Pick<TransferFlowProps, 'derivedInfo' | 'onClose' | 'dispatch' | 'gasFee' | 'txRequest' | 'warnings' | 'exactValue'>

function TransferInnerContent({
  showingSelectorScreen,
  derivedTransferInfo,
  onClose,
  dispatch,
  step,
  gasFee,
  txRequest,
  warnings,
  onFormNext,
  onRetrySubmit,
  onReviewNext,
  onReviewPrev,
  setShowViewOnlyModal,
}: TransferInnerContentProps): JSX.Element | null {
  // TODO: move this up in the tree to mobile specific flow
  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()
  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } = useShouldShowNativeKeyboard()

  const { currencyAmounts, recipient, currencyInInfo, nftIn, chainId, txId } = derivedTransferInfo
  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyInInfo ? currencyAddress(currencyInInfo.currency) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    txRequest,
    onReviewNext,
  )
  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.nftContract?.address,
    nftIn?.tokenId,
    txRequest,
    onReviewNext,
  )

  const onTransfer = (): void => {
    onFormNext()
    nftIn ? transferNFTCallback?.() : transferERC20Callback?.()
  }

  const { trigger: biometricAuthAndTransfer } = useBiometricPrompt(onTransfer)
  const { requiredForTransactions: biometricRequired } = useBiometricAppSettings()

  const onReviewSubmit = async (): Promise<void> => {
    if (biometricRequired) {
      await biometricAuthAndTransfer()
    } else {
      onTransfer()
    }
  }

  switch (step) {
    case TransactionStep.SUBMITTED:
      return (
        <Trace logImpression section={SectionName.TransferPending}>
          <TransferStatus derivedTransferInfo={derivedTransferInfo} onNext={onClose} onTryAgain={onRetrySubmit} />
        </Trace>
      )
    case TransactionStep.FORM:
      return (
        <Trace logImpression section={SectionName.TransferForm}>
          <TransferTokenForm
            derivedTransferInfo={derivedTransferInfo}
            dispatch={dispatch}
            isLayoutPending={isLayoutPending}
            openWalletRestoreModal={openWalletRestoreModal}
            setShowViewOnlyModal={setShowViewOnlyModal}
            showNativeKeyboard={showNativeKeyboard}
            showingSelectorScreen={showingSelectorScreen}
            walletNeedsRestore={!!walletNeedsRestore}
            warnings={warnings}
            onDecimalPadLayout={onDecimalPadLayout}
            onInputPanelLayout={onInputPanelLayout}
            onNext={onFormNext}
          />
        </Trace>
      )
    case TransactionStep.REVIEW:
      return (
        <Trace logImpression section={SectionName.TransferReview}>
          <TransferReview
            derivedTransferInfo={derivedTransferInfo}
            gasFee={gasFee}
            txRequest={txRequest}
            warnings={warnings}
            onPrev={onReviewPrev}
            onReviewSubmit={onReviewSubmit}
          />
        </Trace>
      )
    default:
      return null
  }
}

const styles = StyleSheet.create({
  screen: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
})

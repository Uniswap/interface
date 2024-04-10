import { providers } from 'ethers'
import { default as React, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useShouldShowNativeKeyboard } from 'src/app/hooks'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import Trace from 'src/components/Trace/Trace'
import { Screen } from 'src/components/layout/Screen'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { TransferHeader } from 'src/features/transactions/transfer/TransferHeader'
import { TransferStatus } from 'src/features/transactions/transfer/TransferStatus'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { AnimatedFlex, Flex, useDeviceDimensions, useDeviceInsets, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import {
  TokenSelectorModal,
  TokenSelectorVariation,
} from 'wallet/src/components/TokenSelector/TokenSelector'
import { useBottomSheetContext } from 'wallet/src/components/modals/BottomSheetContext'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'wallet/src/features/gas/types'
import { WarningAction, WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { useTokenSelectorActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenSelectorActionHandlers'
import { useTransactionGasWarning } from 'wallet/src/features/transactions/hooks/useTransactionGasWarning'
import {
  initialState as emptyState,
  transactionStateReducer,
} from 'wallet/src/features/transactions/transactionState/transactionState'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { TransferReview } from 'wallet/src/features/transactions/transfer/TransferReview'
import { TransferTokenForm } from 'wallet/src/features/transactions/transfer/TransferTokenForm'
import { useDerivedTransferInfo } from 'wallet/src/features/transactions/transfer/hooks/useDerivedTransferInfo'
import { useOnSelectRecipient } from 'wallet/src/features/transactions/transfer/hooks/useOnSelectRecipient'
import { useOnToggleShowRecipientSelector } from 'wallet/src/features/transactions/transfer/hooks/useOnToggleShowRecipientSelector'
import {
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'wallet/src/features/transactions/transfer/hooks/useTransferCallback'
import { useTransferTransactionRequest } from 'wallet/src/features/transactions/transfer/hooks/useTransferTransactionRequest'
import { useTransferWarnings } from 'wallet/src/features/transactions/transfer/hooks/useTransferWarnings'
import {
  DerivedTransferInfo,
  TokenSelectorFlow,
} from 'wallet/src/features/transactions/transfer/types'
import { TransactionStep, TransferFlowProps } from 'wallet/src/features/transactions/types'
import { ANIMATE_SPRING_CONFIG } from 'wallet/src/features/transactions/utils'
import { ModalName, SectionName } from 'wallet/src/telemetry/constants'
import { currencyAddress } from 'wallet/src/utils/currencyId'

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

  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const derivedTransferInfo = useDerivedTransferInfo(state)
  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)

  const { isFiatInput, exactAmountToken, exactAmountFiat } = derivedTransferInfo
  const { showRecipientSelector } = state

  const onSelectRecipient = useOnSelectRecipient(dispatch)
  const onToggleShowRecipientSelector = useOnToggleShowRecipientSelector(dispatch)

  const txRequest = useTransferTransactionRequest(derivedTransferInfo)
  const warnings = useTransferWarnings(t, derivedTransferInfo)
  const gasFee = useTransactionGasFee(
    txRequest,
    GasSpeed.Urgent,
    // stop polling for gas once transaction is submitted
    step === TransactionStep.SUBMITTED ||
      warnings.some((warning) => warning.action === WarningAction.DisableReview)
  )

  const transferTxWithGasSettings = useMemo(
    (): providers.TransactionRequest | undefined =>
      gasFee?.params ? { ...txRequest, ...gasFee.params } : txRequest,
    [gasFee?.params, txRequest]
  )

  const gasWarning = useTransactionGasWarning({
    derivedInfo: derivedTransferInfo,
    gasFee: gasFee?.value,
  })

  const allWarnings = useMemo(() => {
    return !gasWarning ? warnings : [...warnings, gasWarning]
  }, [warnings, gasWarning])

  const { onSelectCurrency, onHideTokenSelector } = useTokenSelectorActionHandlers(
    dispatch,
    TokenSelectorFlow.Transfer
  )

  // optimization for not rendering InnerContent initially,
  // when modal is opened with recipient or token selector presented
  const [renderInnerContentRouter, setRenderInnerContentRouter] = useState(!showRecipientSelector)
  useEffect(() => {
    setRenderInnerContentRouter(renderInnerContentRouter || !showRecipientSelector)
  }, [renderInnerContentRouter, showRecipientSelector])

  const screenXOffset = useSharedValue(showRecipientSelector ? -fullWidth : 0)
  useEffect(() => {
    const screenOffset = showRecipientSelector ? 1 : 0
    screenXOffset.value = withSpring(-(fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, showRecipientSelector, fullWidth])

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  const onFormNext = useCallback(() => setStep(TransactionStep.REVIEW), [setStep])
  const onReviewNext = useCallback(() => setStep(TransactionStep.SUBMITTED), [setStep])
  const onReviewPrev = useCallback(() => setStep(TransactionStep.FORM), [setStep])
  const onRetrySubmit = useCallback(() => setStep(TransactionStep.FORM), [setStep])

  const exactValue = isFiatInput ? exactAmountFiat : exactAmountToken

  return (
    <>
      <TouchableWithoutFeedback>
        <Screen edges={['top']}>
          <HandleBar backgroundColor="none" />
          <AnimatedFlex grow row height="100%" style={wrapperStyle}>
            {/* Padding bottom must have a similar size to the handlebar
          height as 100% height doesn't include the handlebar height */}
            <Flex gap="$spacing16" mb={insets.bottom} pb="$spacing12" px="$spacing16" width="100%">
              {step !== TransactionStep.SUBMITTED && (
                <TransferHeader
                  dispatch={dispatch}
                  flowName={t('send.title')}
                  isFiatInput={isFiatInput}
                  setShowViewOnlyModal={setShowViewOnlyModal}
                  showFiatToggle={true}
                  step={step}
                />
              )}
              {renderInnerContentRouter && isSheetReady && (
                <TransferInnerContent
                  derivedInfo={derivedTransferInfo}
                  derivedTransferInfo={derivedTransferInfo}
                  dispatch={dispatch}
                  exactValue={exactValue}
                  gasFee={gasFee}
                  setStep={setStep}
                  showingSelectorScreen={!!showRecipientSelector}
                  step={step}
                  txRequest={transferTxWithGasSettings}
                  warnings={allWarnings}
                  onClose={onClose}
                  onFormNext={onFormNext}
                  onRetrySubmit={onRetrySubmit}
                  onReviewNext={onReviewNext}
                  onReviewPrev={onReviewPrev}
                />
              )}
            </Flex>

            <Flex width="100%">
              {showRecipientSelector ? (
                <RecipientSelect
                  recipient={state.recipient}
                  onSelectRecipient={onSelectRecipient}
                  onToggleShowRecipientSelector={onToggleShowRecipientSelector}
                />
              ) : null}
            </Flex>

            {showViewOnlyModal && (
              <WarningModal
                caption={t('send.warning.viewOnly.message')}
                confirmText={t('common.button.dismiss')}
                icon={
                  <EyeIcon
                    color={colors.neutral2.get()}
                    height={iconSizes.icon24}
                    width={iconSizes.icon24}
                  />
                }
                modalName={ModalName.SwapWarning}
                severity={WarningSeverity.Low}
                title={t('send.warning.viewOnly.title')}
                onClose={(): void => setShowViewOnlyModal(false)}
                onConfirm={(): void => setShowViewOnlyModal(false)}
              />
            )}
          </AnimatedFlex>
        </Screen>
      </TouchableWithoutFeedback>
      {!!state.selectingCurrencyField && (
        <TokenSelectorModal
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Transfer}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
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
} & Pick<
  TransferFlowProps,
  'derivedInfo' | 'onClose' | 'dispatch' | 'gasFee' | 'txRequest' | 'warnings' | 'exactValue'
>

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
}: TransferInnerContentProps): JSX.Element | null {
  // TODO: move this up in the tree to mobile specific flow
  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()
  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const { currencyAmounts, recipient, currencyInInfo, nftIn, chainId, txId } = derivedTransferInfo
  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyInInfo ? currencyAddress(currencyInInfo.currency) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    txRequest,
    onReviewNext
  )
  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.nftContract?.address,
    nftIn?.tokenId,
    txRequest,
    onReviewNext
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
          <TransferStatus
            derivedTransferInfo={derivedTransferInfo}
            onNext={onClose}
            onTryAgain={onRetrySubmit}
          />
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

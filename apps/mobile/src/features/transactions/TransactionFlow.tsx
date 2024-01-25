import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useShouldShowNativeKeyboard } from 'src/app/hooks'
import { Screen } from 'src/components/layout/Screen'
import Trace from 'src/components/Trace/Trace'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { HeaderContent } from 'src/features/transactions/TransactionFlowHeaderContent'
import { TransferStatus } from 'src/features/transactions/transfer/TransferStatus'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { AnimatedFlex, Flex, useDeviceDimensions, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { iconSizes } from 'ui/src/theme'
import { useBottomSheetContext } from 'wallet/src/components/modals/BottomSheetContext'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { SwapSettingsModal } from 'wallet/src/features/transactions/swap/modals/SwapSettingsModal'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { transactionStateActions } from 'wallet/src/features/transactions/transactionState/transactionState'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import {
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'wallet/src/features/transactions/transfer/hooks/useTransferCallback'
import { TransferReview } from 'wallet/src/features/transactions/transfer/TransferReview'
import { TransferTokenForm } from 'wallet/src/features/transactions/transfer/TransferTokenForm'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
import { TransactionFlowProps, TransactionStep } from 'wallet/src/features/transactions/types'
import { ANIMATE_SPRING_CONFIG } from 'wallet/src/features/transactions/utils'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName, SectionName } from 'wallet/src/telemetry/constants'
import { currencyAddress } from 'wallet/src/utils/currencyId'

type InnerContentProps = Pick<
  TransactionFlowProps,
  | 'derivedInfo'
  | 'onClose'
  | 'dispatch'
  | 'gasFee'
  | 'txRequest'
  | 'approveTxRequest'
  | 'warnings'
  | 'exactValue'
> & {
  step: number
  setStep: (step: TransactionStep) => void
  showingSelectorScreen: boolean
  gasFee: GasFeeResult
}

function isSwapInfo(
  derivedInfo: DerivedTransferInfo | DerivedSwapInfo
): derivedInfo is DerivedSwapInfo {
  return (derivedInfo as DerivedSwapInfo).trade !== undefined
}

export function TransactionFlow({
  flowName,
  showRecipientSelector,
  recipientSelector,
  derivedInfo,
  approveTxRequest,
  txRequest,
  gasFee,
  step,
  setStep,
  onClose,
  dispatch,
  warnings,
  exactValue,
  isFiatInput,
  showFiatToggle,
}: TransactionFlowProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()

  const { isSheetReady } = useBottomSheetContext()

  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const isSwap = isSwapInfo(derivedInfo)
  const derivedSwapInfo = isSwap ? derivedInfo : undefined
  const { customSlippageTolerance } = derivedSwapInfo ?? {}

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

  const setCustomSlippageTolerance = useCallback(
    (newCustomSlippageTolerance: number | undefined): void =>
      dispatch(transactionStateActions.setCustomSlippageTolerance(newCustomSlippageTolerance)),
    [dispatch]
  )

  return (
    <TouchableWithoutFeedback>
      <Screen edges={['top']}>
        <HandleBar backgroundColor="none" />
        <AnimatedFlex grow row height="100%" style={wrapperStyle}>
          {/* Padding bottom must have a similar size to the handlebar
          height as 100% height doesn't include the handlebar height */}
          <Flex gap="$spacing16" pb="$spacing24" px="$spacing16" width="100%">
            {step !== TransactionStep.SUBMITTED && (
              <HeaderContent
                customSlippageTolerance={customSlippageTolerance}
                dispatch={dispatch}
                flowName={flowName}
                isFiatInput={isFiatInput}
                isSwap={isSwap}
                setShowSettingsModal={setShowSettingsModal}
                setShowViewOnlyModal={setShowViewOnlyModal}
                showFiatToggle={showFiatToggle}
                step={step}
              />
            )}
            {renderInnerContentRouter && isSheetReady && (
              <InnerContentRouter
                approveTxRequest={approveTxRequest}
                derivedInfo={derivedInfo}
                dispatch={dispatch}
                exactValue={exactValue}
                gasFee={gasFee}
                setStep={setStep}
                showingSelectorScreen={!!showRecipientSelector}
                step={step}
                txRequest={txRequest}
                warnings={warnings}
                onClose={onClose}
              />
            )}
          </Flex>
          {showViewOnlyModal && (
            <WarningModal
              caption={
                isSwap
                  ? t('You need to import this wallet via recovery phrase to swap tokens.')
                  : t('You need to import this wallet via recovery phrase to send assets.')
              }
              confirmText={t('Dismiss')}
              icon={
                <EyeIcon
                  color={colors.neutral2.get()}
                  height={iconSizes.icon24}
                  width={iconSizes.icon24}
                />
              }
              modalName={ModalName.SwapWarning}
              severity={WarningSeverity.Low}
              title={t('This wallet is view-only')}
              onClose={(): void => setShowViewOnlyModal(false)}
              onConfirm={(): void => setShowViewOnlyModal(false)}
            />
          )}
          {isSwap && showSettingsModal ? (
            <SwapSettingsModal
              derivedSwapInfo={derivedInfo}
              setCustomSlippageTolerance={setCustomSlippageTolerance}
              onClose={(): void => {
                setShowSettingsModal(false)
              }}
            />
          ) : null}

          {showRecipientSelector && recipientSelector ? recipientSelector : null}
        </AnimatedFlex>
      </Screen>
    </TouchableWithoutFeedback>
  )
}

function InnerContentRouter(props: InnerContentProps): JSX.Element {
  const { derivedInfo, setStep } = props
  const onFormNext = useCallback(() => setStep(TransactionStep.REVIEW), [setStep])
  const onReviewNext = useCallback(() => setStep(TransactionStep.SUBMITTED), [setStep])
  const onReviewPrev = useCallback(() => setStep(TransactionStep.FORM), [setStep])
  const onRetrySubmit = useCallback(() => setStep(TransactionStep.FORM), [setStep])

  const isSwap = isSwapInfo(derivedInfo)
  if (isSwap) {
    return (
      <SwapInnerContent
        derivedSwapInfo={derivedInfo}
        onFormNext={onFormNext}
        onRetrySubmit={onRetrySubmit}
        onReviewNext={onReviewNext}
        onReviewPrev={onReviewPrev}
        {...props}
      />
    )
  }
  return (
    <TransferInnerContent
      derivedTransferInfo={derivedInfo}
      onFormNext={onFormNext}
      onRetrySubmit={onRetrySubmit}
      onReviewNext={onReviewNext}
      onReviewPrev={onReviewPrev}
      {...props}
    />
  )
}

interface SwapInnerContentProps extends InnerContentProps {
  derivedSwapInfo: DerivedSwapInfo
  onFormNext: () => void
  onReviewNext: () => void
  onReviewPrev: () => void
  onRetrySubmit: () => void
}

function SwapInnerContent({
  derivedSwapInfo,
  onClose,
  dispatch,
  gasFee,
  approveTxRequest,
  txRequest,
  warnings,
  onFormNext,
  onReviewNext,
  onReviewPrev,
  onRetrySubmit,
  step,
  exactValue,
  showingSelectorScreen,
}: SwapInnerContentProps): JSX.Element | null {
  switch (step) {
    case TransactionStep.SUBMITTED:
      return (
        <Trace logImpression section={SectionName.SwapPending}>
          <SwapStatus
            derivedSwapInfo={derivedSwapInfo}
            onNext={onClose}
            onTryAgain={onRetrySubmit}
          />
        </Trace>
      )

    case TransactionStep.FORM:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapForm
            derivedSwapInfo={derivedSwapInfo}
            dispatch={dispatch}
            exactValue={exactValue}
            showingSelectorScreen={showingSelectorScreen}
            warnings={warnings}
            onNext={onFormNext}
          />
        </Trace>
      )
    case TransactionStep.REVIEW:
      // Removed trace from here as it doesn't fire for some reason. Event fires in the component itself, can investigate at a later date
      return (
        <SwapReview
          approveTxRequest={approveTxRequest}
          derivedSwapInfo={derivedSwapInfo}
          exactValue={exactValue}
          gasFee={gasFee}
          txRequest={txRequest}
          warnings={warnings}
          onNext={onReviewNext}
          onPrev={onReviewPrev}
        />
      )
    default:
      return null
  }
}

interface TransferInnerContentProps extends InnerContentProps {
  derivedTransferInfo: DerivedTransferInfo
  onFormNext: () => void
  onReviewNext: () => void
  onReviewPrev: () => void
  onRetrySubmit: () => void
}

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

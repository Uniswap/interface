import { AnyAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import React, { Dispatch, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedFlex } from 'src/components/layout'
import { HandleBar } from 'src/components/modals/HandleBar'
import { Warning, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { SwapSettingsModal } from 'src/features/transactions/swap/modals/SwapSettingsModal'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { HeaderContent } from 'src/features/transactions/TransactionFlowHeaderContent'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferReview } from 'src/features/transactions/transfer/TransferReview'
import { TransferStatus } from 'src/features/transactions/transfer/TransferStatus'
import { TransferTokenForm } from 'src/features/transactions/transfer/TransferTokenForm'
import { Flex, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { dimensions, iconSizes } from 'ui/src/theme'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { ANIMATE_SPRING_CONFIG } from 'wallet/src/features/transactions/utils'

export enum TransactionStep {
  FORM,
  REVIEW,
  SUBMITTED,
}

export interface TransactionFlowProps {
  dispatch: Dispatch<AnyAction>
  showRecipientSelector?: boolean
  recipientSelector?: JSX.Element
  flowName: string
  derivedInfo: DerivedTransferInfo | DerivedSwapInfo
  onClose: () => void
  approveTxRequest?: providers.TransactionRequest
  txRequest?: providers.TransactionRequest
  gasFee: GasFeeResult
  step: TransactionStep
  setStep: (newStep: TransactionStep) => void
  warnings: Warning[]
  exactValue: string
  isUSDInput?: boolean
  showUSDToggle?: boolean
}

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
  isUSDInput,
  showUSDToggle,
}: TransactionFlowProps): JSX.Element {
  const colors = useSporeColors()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

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

  const screenXOffset = useSharedValue(showRecipientSelector ? -dimensions.fullWidth : 0)
  useEffect(() => {
    const screenOffset = showRecipientSelector ? 1 : 0
    screenXOffset.value = withSpring(-(dimensions.fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, showRecipientSelector])

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  return (
    <TouchableWithoutFeedback>
      <Flex style={{ marginTop: insets.top }}>
        <HandleBar backgroundColor="none" />
        <AnimatedFlex grow row gap="none" height="100%" style={wrapperStyle}>
          <Flex
            gap="$spacing16"
            pb={IS_ANDROID ? '$spacing32' : '$spacing16'}
            px="$spacing16"
            style={{ marginBottom: insets.bottom }}
            width="100%">
            {step !== TransactionStep.SUBMITTED && (
              <HeaderContent
                customSlippageTolerance={customSlippageTolerance}
                dispatch={dispatch}
                flowName={flowName}
                isSwap={isSwap}
                isUSDInput={isUSDInput}
                setShowSettingsModal={setShowSettingsModal}
                setShowViewOnlyModal={setShowViewOnlyModal}
                showUSDToggle={showUSDToggle}
                step={step}
              />
            )}
            {renderInnerContentRouter && (
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
                  color={colors.neutral2.val}
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
              dispatch={dispatch}
              onClose={(): void => {
                setShowSettingsModal(false)
              }}
            />
          ) : null}

          {showRecipientSelector && recipientSelector ? recipientSelector : null}
        </AnimatedFlex>
      </Flex>
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
  if (isSwap)
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
            showingSelectorScreen={showingSelectorScreen}
            warnings={warnings}
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
            onNext={onReviewNext}
            onPrev={onReviewPrev}
          />
        </Trace>
      )
    default:
      return null
  }
}

import { AnyAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import React, { Dispatch, ReactElement, useCallback, useEffect } from 'react'
import { TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import SortIcon from 'src/assets/icons/sort.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Warning } from 'src/components/modals/WarningModal/types'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { SectionName } from 'src/features/telemetry/constants'
import { DerivedSwapInfo, useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferReview } from 'src/features/transactions/transfer/TransferReview'
import { TransferStatus } from 'src/features/transactions/transfer/TransferStatus'
import { TransferTokenForm } from 'src/features/transactions/transfer/TransferTokenForm'
import { ANIMATE_SPRING_CONFIG } from 'src/features/transactions/utils'
import { dimensions } from 'src/styles/sizing'

export enum TransactionStep {
  FORM,
  REVIEW,
  SUBMITTED,
}

interface TransactionFlowProps {
  dispatch: Dispatch<AnyAction>
  showTokenSelector: boolean
  showRecipientSelector?: boolean
  tokenSelector: ReactElement
  recipientSelector?: ReactElement
  flowName: string
  derivedInfo: DerivedTransferInfo | DerivedSwapInfo
  onClose: () => void
  approveTxRequest?: providers.TransactionRequest
  txRequest?: providers.TransactionRequest
  totalGasFee?: string
  gasFallbackUsed?: boolean
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
  | 'totalGasFee'
  | 'gasFallbackUsed'
  | 'txRequest'
  | 'approveTxRequest'
  | 'warnings'
  | 'exactValue'
> & {
  step: number
  setStep: (step: TransactionStep) => void
  showingSelectorScreen: boolean
}

function isSwapInfo(
  derivedInfo: DerivedTransferInfo | DerivedSwapInfo
): derivedInfo is DerivedSwapInfo {
  return (derivedInfo as DerivedSwapInfo).trade !== undefined
}

export function TransactionFlow({
  flowName,
  showTokenSelector,
  showRecipientSelector,
  tokenSelector,
  recipientSelector,
  derivedInfo,
  approveTxRequest,
  txRequest,
  totalGasFee,
  gasFallbackUsed,
  step,
  setStep,
  onClose,
  dispatch,
  warnings,
  exactValue,
  isUSDInput,
  showUSDToggle,
}: TransactionFlowProps) {
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()

  const screenXOffset = useSharedValue(showTokenSelector || showRecipientSelector ? 1 : 0)
  useEffect(() => {
    const screenOffset = showTokenSelector || showRecipientSelector ? 1 : 0
    screenXOffset.value = withSpring(-(dimensions.fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, showTokenSelector, showRecipientSelector])

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  const { onToggleUSDInput } = useSwapActionHandlers(dispatch)

  return (
    <TouchableWithoutFeedback>
      <AnimatedFlex grow row gap="none" height="100%" style={wrapperStyle}>
        <Flex gap="sm" pb="md" px="md" style={{ marginBottom: insets.bottom }} width="100%">
          {step !== TransactionStep.SUBMITTED && (
            <Flex row alignItems="center" justifyContent="space-between" px="sm">
              <Text pt="xs" textAlign="left" variant={{ xs: 'subheadSmall', sm: 'subheadLarge' }}>
                {flowName}
              </Text>
              {step === TransactionStep.FORM && showUSDToggle && (
                <TouchableArea
                  bg={isUSDInput ? 'background2' : 'none'}
                  borderRadius="xl"
                  px="sm"
                  py="xs"
                  onPress={() => onToggleUSDInput(!isUSDInput)}>
                  <Flex row alignItems="center" gap="xxxs">
                    <SortIcon
                      color={theme.colors.textSecondary}
                      height={theme.iconSizes.sm}
                      width={theme.iconSizes.sm}
                    />
                    <Text
                      color={isUSDInput ? 'textPrimary' : 'textSecondary'}
                      variant="buttonLabelSmall">
                      USD
                    </Text>
                  </Flex>
                </TouchableArea>
              )}
            </Flex>
          )}
          <InnerContentRouter
            approveTxRequest={approveTxRequest}
            derivedInfo={derivedInfo}
            dispatch={dispatch}
            exactValue={exactValue}
            gasFallbackUsed={gasFallbackUsed}
            setStep={setStep}
            showingSelectorScreen={showRecipientSelector || showTokenSelector}
            step={step}
            totalGasFee={totalGasFee}
            txRequest={txRequest}
            warnings={warnings}
            onClose={onClose}
          />
        </Flex>
        {showTokenSelector ? tokenSelector : null}
        {showRecipientSelector && recipientSelector ? recipientSelector : null}
      </AnimatedFlex>
    </TouchableWithoutFeedback>
  )
}

function InnerContentRouter(props: InnerContentProps) {
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
  totalGasFee,
  gasFallbackUsed,
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
}: SwapInnerContentProps) {
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
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReview
            approveTxRequest={approveTxRequest}
            derivedSwapInfo={derivedSwapInfo}
            exactValue={exactValue}
            gasFallbackUsed={gasFallbackUsed}
            totalGasFee={totalGasFee}
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
  totalGasFee,
  txRequest,
  warnings,
  onFormNext,
  onRetrySubmit,
  onReviewNext,
  onReviewPrev,
}: TransferInnerContentProps) {
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
            totalGasFee={totalGasFee}
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

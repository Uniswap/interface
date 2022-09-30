import { AnyAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import React, { Dispatch, ReactElement, useCallback, useEffect } from 'react'
import { Keyboard, TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Warning } from 'src/components/modals/types'
import { Text } from 'src/components/Text'
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
  dispatch: Dispatch<AnyAction> // TODO: remove when gas endpoint work lands
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
  step: TransactionStep
  setStep: (newStep: TransactionStep) => void
  warnings: Warning[]
}

type InnerContentProps = Pick<
  TransactionFlowProps,
  | 'derivedInfo'
  | 'onClose'
  | 'dispatch'
  | 'totalGasFee'
  | 'txRequest'
  | 'approveTxRequest'
  | 'warnings'
> & {
  step: number
  setStep: (step: TransactionStep) => void
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
  step,
  setStep,
  onClose,
  dispatch,
  warnings,
}: TransactionFlowProps) {
  // enable tap to dismiss keyboard on whole modal screen
  // this only applies when we show native keyboard on smaller devices
  const onBackgroundPress = () => {
    Keyboard.dismiss()
  }

  const screenXOffset = useSharedValue(0)
  useEffect(() => {
    const screenOffset = showTokenSelector || showRecipientSelector ? 1 : 0
    screenXOffset.value = withSpring(-(dimensions.fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, showTokenSelector, showRecipientSelector])

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  const { onToggleUSDInput } = useSwapActionHandlers(dispatch)
  const { isUSDInput } = derivedInfo

  return (
    <TouchableWithoutFeedback onPress={onBackgroundPress}>
      <AnimatedFlex grow row gap="none" height="100%" paddingBottom="xl" style={wrapperStyle}>
        <Flex gap="xs" px="md" width="100%">
          {step !== TransactionStep.SUBMITTED && (
            <Flex row alignItems="center" justifyContent="space-between" px="sm">
              <Text py="xs" textAlign="left" variant="subhead">
                {flowName}
              </Text>
              {step === TransactionStep.FORM && (
                <PrimaryButton
                  borderRadius="md"
                  label="$   USD"
                  px="sm"
                  py="xs"
                  testID="toggle-usd"
                  textVariant="smallLabel"
                  variant={isUSDInput ? 'transparentBlue' : 'transparent'}
                  onPress={() => onToggleUSDInput(!isUSDInput)}
                />
              )}
            </Flex>
          )}
          <InnerContentRouter
            approveTxRequest={approveTxRequest}
            derivedInfo={derivedInfo}
            dispatch={dispatch}
            setStep={setStep}
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
  const { form, review, submitted } = useGetInnerContent(props)
  switch (props.step) {
    case TransactionStep.SUBMITTED:
      return submitted
    case TransactionStep.FORM:
      return form
    case TransactionStep.REVIEW:
      return review
    default:
      return null
  }
}

const useGetInnerContent = ({
  derivedInfo,
  onClose,
  dispatch,
  setStep,
  totalGasFee,
  approveTxRequest,
  txRequest,
  warnings,
}: InnerContentProps): {
  form: ReactElement
  review: ReactElement
  submitted: ReactElement
} => {
  const onRetrySubmit = useCallback(() => setStep(TransactionStep.FORM), [setStep])
  const onFormNext = useCallback(() => setStep(TransactionStep.REVIEW), [setStep])
  const onReviewNext = useCallback(() => setStep(TransactionStep.SUBMITTED), [setStep])
  const onReviewPrev = useCallback(() => setStep(TransactionStep.FORM), [setStep])

  const isSwap = isSwapInfo(derivedInfo)
  if (isSwap) {
    return {
      form: (
        <SwapForm
          derivedSwapInfo={derivedInfo}
          dispatch={dispatch}
          warnings={warnings}
          onNext={onFormNext}
        />
      ),
      review: (
        <SwapReview
          approveTxRequest={approveTxRequest}
          derivedSwapInfo={derivedInfo}
          totalGasFee={totalGasFee}
          txRequest={txRequest}
          warnings={warnings}
          onNext={onReviewNext}
          onPrev={onReviewPrev}
        />
      ),
      submitted: (
        <SwapStatus derivedSwapInfo={derivedInfo} onNext={onClose} onTryAgain={onRetrySubmit} />
      ),
    }
  }

  return {
    form: (
      <TransferTokenForm
        derivedTransferInfo={derivedInfo}
        dispatch={dispatch}
        warnings={warnings}
        onNext={onFormNext}
      />
    ),
    review: (
      <TransferReview
        derivedTransferInfo={derivedInfo}
        totalGasFee={totalGasFee}
        txRequest={txRequest}
        warnings={warnings}
        onNext={onReviewNext}
        onPrev={onReviewPrev}
      />
    ),
    submitted: (
      <TransferStatus
        derivedTransferInfo={derivedInfo}
        onNext={onClose}
        onTryAgain={onRetrySubmit}
      />
    ),
  }
}

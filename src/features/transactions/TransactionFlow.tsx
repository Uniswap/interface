import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, ReactElement, useCallback, useEffect, useState } from 'react'
import { Keyboard, LayoutChangeEvent, TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
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
}

type InnerContentProps = Pick<TransactionFlowProps, 'derivedInfo' | 'onClose' | 'dispatch'> & {
  isCompressedView?: boolean
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
  onClose,
  dispatch,
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

  // use initial content height only to determine native keyboard view
  // because show/hiding the custom keyboard will change the content height
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)

  const onLayout = (event: LayoutChangeEvent) => {
    const totalHeight = event.nativeEvent.layout.height
    if (initialContentHeight !== undefined) return

    setInitialContentHeight(totalHeight)
  }

  // TODO: add support for compressed view on TransferTokenForm
  const isCompressedView = Boolean(
    initialContentHeight && dimensions.fullHeight < initialContentHeight
  )

  return (
    <TouchableWithoutFeedback onPress={onBackgroundPress}>
      <AnimatedFlex grow row flex={1} gap="none" py="md" style={wrapperStyle}>
        <Flex grow gap="xs" width="100%" onLayout={onLayout}>
          <Text textAlign="center" variant="subhead">
            {flowName}
          </Text>
          <InnerContentRouter
            derivedInfo={derivedInfo}
            dispatch={dispatch}
            isCompressedView={isCompressedView}
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
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)
  const { form, review, submitted } = useGetInnerContent({ ...props, setStep })
  switch (step) {
    case TransactionStep.SUBMITTED:
      return submitted
    case TransactionStep.FORM:
      return form
    case TransactionStep.REVIEW:
      return review
  }
}

const useGetInnerContent = ({
  derivedInfo,
  onClose,
  dispatch,
  isCompressedView,
  setStep,
}: InnerContentProps & { setStep: (step: TransactionStep) => void }): {
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
          isCompressedView={!!isCompressedView}
          onNext={onFormNext}
        />
      ),
      review: (
        <SwapReview
          derivedSwapInfo={derivedInfo}
          dispatch={dispatch}
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
        onNext={onFormNext}
      />
    ),
    review: (
      <TransferReview
        derivedTransferInfo={derivedInfo}
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

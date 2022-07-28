import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, TouchableWithoutFeedback } from 'react-native'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { WarningAction, WarningModalType } from 'src/components/warnings/types'
import { WarningModal } from 'src/components/warnings/WarningModal'
import {
  DerivedSwapInfo,
  useDerivedSwapInfo,
  useSwapCallbackFromDerivedSwapInfo,
} from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import {
  initialState as emptyState,
  TransactionState,
  transactionStateActions,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { dimensions } from 'src/styles/sizing'

interface SwapFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

export enum SwapStep {
  FORM,
  REVIEW,
  SUBMITTED,
}

type InnerContentProps = {
  dispatch: Dispatch<AnyAction>
  derivedSwapInfo: DerivedSwapInfo
  step: SwapStep
  setStep: (step: SwapStep) => void
  onClose: () => void
  isCompressedView: boolean
}

function SwapInnerContent({
  dispatch,
  step,
  setStep,
  onClose,
  derivedSwapInfo,
  isCompressedView,
}: InnerContentProps) {
  if (step === SwapStep.SUBMITTED) {
    return (
      <SwapStatus
        derivedSwapInfo={derivedSwapInfo}
        onNext={onClose}
        onTryAgain={() => setStep(SwapStep.FORM)}
      />
    )
  }

  if (step === SwapStep.FORM) {
    return (
      <SwapForm
        derivedSwapInfo={derivedSwapInfo}
        dispatch={dispatch}
        isCompressedView={isCompressedView}
        onNext={() => setStep(SwapStep.REVIEW)}
      />
    )
  }

  return (
    <SwapReview
      derivedSwapInfo={derivedSwapInfo}
      dispatch={dispatch}
      onNext={() => setStep(SwapStep.SUBMITTED)}
      onPrev={() => setStep(SwapStep.FORM)}
    />
  )
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const [step, setStep] = useState<SwapStep>(SwapStep.FORM)
  const derivedSwapInfo = useDerivedSwapInfo(state)
  const { swapCallback } = useSwapCallbackFromDerivedSwapInfo(derivedSwapInfo)

  // use initial content height only to determine native keyboard view
  // because show/hiding the custom keyboard will change the content height
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)

  const { warningModalType, warnings } = derivedSwapInfo
  const warning =
    warningModalType === WarningModalType.INFORMATIONAL
      ? warnings.find(showWarningInPanel)
      : warnings.find((w) => w.action === WarningAction.WarnBeforeSubmit)

  const onLayout = (event: LayoutChangeEvent) => {
    const totalHeight = event.nativeEvent.layout.height
    if (initialContentHeight !== undefined) return

    setInitialContentHeight(totalHeight)
  }

  const isCompressedView = Boolean(
    initialContentHeight && dimensions.fullHeight < initialContentHeight
  )

  // enable tap to dismiss keyboard on whole modal screen
  // this only applies when we show native keyboard on smaller devices
  const onBackgroundPress = () => {
    Keyboard.dismiss()
  }

  return (
    <TouchableWithoutFeedback onPress={onBackgroundPress}>
      <Flex grow gap="xs" py="xs" onLayout={onLayout}>
        <WarningModal
          cancelLabel={t('Cancel swap')}
          continueLabel={t('Swap anyway')}
          warning={warning}
          warningModalType={warningModalType}
          onClose={() => dispatch(transactionStateActions.closeWarningModal())}
          onPressContinue={
            derivedSwapInfo.warningModalType === WarningModalType.ACTION ? swapCallback : undefined
          }
        />
        <Text textAlign="center" variant="subhead">
          {t('Swap')}
        </Text>
        <SwapInnerContent
          derivedSwapInfo={derivedSwapInfo}
          dispatch={dispatch}
          isCompressedView={isCompressedView}
          setStep={setStep}
          step={step}
          onClose={onClose}
        />
      </Flex>
    </TouchableWithoutFeedback>
  )
}

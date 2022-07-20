import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { WarningModal } from 'src/components/warnings/WarningModal'
import { DerivedSwapInfo, useDerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import {
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'

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
}

function SwapInnerContent({
  dispatch,
  step,
  setStep,
  onClose,
  derivedSwapInfo,
}: InnerContentProps) {
  if (step === SwapStep.FORM) {
    return (
      <SwapForm
        derivedSwapInfo={derivedSwapInfo}
        dispatch={dispatch}
        onNext={() => setStep(SwapStep.REVIEW)}
      />
    )
  }

  return (
    <SwapReview
      derivedSwapInfo={derivedSwapInfo}
      dispatch={dispatch}
      onNext={onClose}
      onPrev={() => setStep(SwapStep.FORM)}
    />
  )
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const [step, setStep] = useState<SwapStep>(SwapStep.FORM)
  const derivedSwapInfo = useDerivedSwapInfo(state)

  return (
    <Flex fill gap="xs" justifyContent="space-between" py="md">
      <WarningModal closeModal={onClose} derivedSwapInfo={derivedSwapInfo} dispatch={dispatch} />
      <Text textAlign="center" variant="subhead">
        {t('Swap')}
      </Text>
      <SwapInnerContent
        derivedSwapInfo={derivedSwapInfo}
        dispatch={dispatch}
        setStep={setStep}
        step={step}
        onClose={onClose}
      />
    </Flex>
  )
}

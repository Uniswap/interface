import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
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
  // TODO: Add submission states: pending, success, error
}

type InnerContentProps = {
  dispatch: Dispatch<AnyAction>
  state: TransactionState
  step: SwapStep
  setStep: (step: SwapStep) => void
  onClose: () => void
}

function SwapInnerContent({ dispatch, state, step, setStep, onClose }: InnerContentProps) {
  if (step === SwapStep.FORM)
    return <SwapForm dispatch={dispatch} state={state} onNext={() => setStep(SwapStep.REVIEW)} />

  return (
    <SwapReview
      dispatch={dispatch}
      state={state}
      onNext={onClose}
      onPrev={() => setStep(SwapStep.FORM)}
    />
  )
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps) {
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const [step, setStep] = useState<SwapStep>(SwapStep.FORM)
  const { t } = useTranslation()

  return (
    <Flex fill gap="xs" justifyContent="space-between" py="md">
      <Text textAlign="center" variant="subhead">
        {t('Swap')}
      </Text>
      <SwapInnerContent
        dispatch={dispatch}
        setStep={setStep}
        state={state}
        step={step}
        onClose={onClose}
      />
    </Flex>
  )
}

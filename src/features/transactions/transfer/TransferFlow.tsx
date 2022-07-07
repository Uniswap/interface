import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import {
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { TransferReview } from 'src/features/transactions/transfer/TransferReview'
import { TransferTokenForm } from 'src/features/transactions/transfer/TransferTokenForm'

interface TransferFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

export enum TransferStep {
  FORM,
  REVIEW,
  // TODO: Add submission states: pending, success, error
}

type InnerContentProps = {
  dispatch: Dispatch<AnyAction>
  state: TransactionState
  step: TransferStep
  setStep: (step: TransferStep) => void
  onClose: () => void
}

function TransferInnerContent({ dispatch, state, step, setStep, onClose }: InnerContentProps) {
  if (step === TransferStep.FORM)
    return (
      <TransferTokenForm
        dispatch={dispatch}
        state={state}
        onNext={() => setStep(TransferStep.REVIEW)}
      />
    )
  return <TransferReview state={state} onNext={onClose} onPrev={() => setStep(TransferStep.FORM)} />
}

export function TransferFlow({ prefilledState, onClose }: TransferFormProps) {
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const [step, setStep] = useState<TransferStep>(TransferStep.FORM)
  const { t } = useTranslation()

  return (
    <Flex fill bg="backgroundSurface" gap="xs" justifyContent="space-between" py="md">
      <Text textAlign="center" variant="subhead">
        {t('Send')}
      </Text>
      <TransferInnerContent
        dispatch={dispatch}
        setStep={setStep}
        state={state}
        step={step}
        onClose={onClose}
      />
    </Flex>
  )
}

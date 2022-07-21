import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import {
  initialState as emptyState,
  TransactionState,
  transactionStateActions,
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
  const { swapCallback } = useSwapCallbackFromDerivedSwapInfo(derivedSwapInfo)

  const warning =
    derivedSwapInfo.warningModalType === WarningModalType.INFORMATIONAL
      ? derivedSwapInfo.warnings.find(showWarningInPanel)
      : derivedSwapInfo.warnings.find((w) => w.action === WarningAction.WarnBeforeSubmit)

  return (
    <Flex fill gap="xs" justifyContent="space-between" py="md">
      <WarningModal
        cancelLabel={t('Cancel swap')}
        continueLabel={t('Swap anyway')}
        warning={warning}
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
        setStep={setStep}
        step={step}
        onClose={onClose}
      />
    </Flex>
  )
}

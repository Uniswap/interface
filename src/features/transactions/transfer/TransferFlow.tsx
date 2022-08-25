import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React, { Dispatch, Suspense, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { Text } from 'src/components/Text'
import { TokenSelectorVariation } from 'src/components/TokenSelector/SearchResults'
import { TokenSelect } from 'src/components/TokenSelector/TokenSelect'
import { useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { useDerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferReview } from 'src/features/transactions/transfer/TransferReview'
import { TransferStatus } from 'src/features/transactions/transfer/TransferStatus'
import { TransferTokenForm } from 'src/features/transactions/transfer/TransferTokenForm'
import {
  createOnSelectRecipient,
  createOnToggleShowRecipientSelector,
} from 'src/features/transactions/transfer/utils'
import { ANIMATE_SPRING_CONFIG } from 'src/features/transactions/utils'
import { dimensions } from 'src/styles/sizing'

interface TransferFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

export enum TransferStep {
  FORM,
  REVIEW,
  SUBMITTED,
}

type InnerContentProps = {
  dispatch: Dispatch<AnyAction>
  state: TransactionState
  step: TransferStep
  setStep: (step: TransferStep) => void
  onClose: () => void
}

function TransferInnerContent({ dispatch, state, step, setStep, onClose }: InnerContentProps) {
  const derivedTransferInfo = useDerivedTransferInfo(state)

  switch (step) {
    case TransferStep.SUBMITTED:
      return (
        <TransferStatus
          derivedTransferInfo={derivedTransferInfo}
          txId={state.txId}
          onNext={onClose}
          onTryAgain={() => setStep(TransferStep.FORM)}
        />
      )
    case TransferStep.FORM:
      return (
        <Suspense fallback={<Loading repeat={3} />}>
          <TransferTokenForm
            derivedTransferInfo={derivedTransferInfo}
            dispatch={dispatch}
            state={state}
            onNext={() => setStep(TransferStep.REVIEW)}
          />
        </Suspense>
      )
    case TransferStep.REVIEW:
      return (
        <TransferReview
          derivedTransferInfo={derivedTransferInfo}
          dispatch={dispatch}
          state={state}
          onNext={() => setStep(TransferStep.SUBMITTED)}
          onPrev={() => setStep(TransferStep.FORM)}
        />
      )
  }
}

export function TransferFlow({ prefilledState, onClose }: TransferFormProps) {
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const [step, setStep] = useState<TransferStep>(TransferStep.FORM)
  const { t } = useTranslation()
  const { onSelectCurrency, onHideTokenSelector } = useSwapActionHandlers(dispatch)
  const onSelectRecipient = createOnSelectRecipient(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)

  const screenXOffset = useSharedValue(0)
  useEffect(() => {
    const screenOffset =
      state.selectingCurrencyField !== undefined || state.showRecipientSelector ? 1 : 0
    screenXOffset.value = withSpring(-(dimensions.fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, state.selectingCurrencyField, state.showRecipientSelector])

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: screenXOffset.value,
        },
      ],
    }
  })

  return (
    <Flex fill bg="backgroundSurface" gap="xs" justifyContent="space-between" py="md">
      <AnimatedFlex grow row flex={1} gap="none" style={wrapperStyle}>
        <Flex grow gap="xs" py="xs" width="100%">
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
        {state.selectingCurrencyField && (
          <TokenSelect
            variation={TokenSelectorVariation.BalancesOnly}
            onBack={onHideTokenSelector}
            onSelectCurrency={(currency: Currency) =>
              onSelectCurrency(CurrencyField.INPUT, currency)
            }
          />
        )}
        {state.showRecipientSelector && (
          <RecipientSelect
            onSelectRecipient={onSelectRecipient}
            onToggleShowRecipientSelector={onToggleShowRecipientSelector}
          />
        )}
      </AnimatedFlex>
    </Flex>
  )
}

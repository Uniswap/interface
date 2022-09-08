import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React, { Dispatch, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TokenSelector, TokenSelectorVariation } from 'src/components/TokenSelector/TokenSelector'
import {
  DerivedSwapInfo,
  useDerivedSwapInfo,
  useSwapActionHandlers,
} from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { ANIMATE_SPRING_CONFIG } from 'src/features/transactions/utils'
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

function otherCurrencyField(field: CurrencyField): CurrencyField {
  return field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const [step, setStep] = useState<SwapStep>(SwapStep.FORM)
  const derivedSwapInfo = useDerivedSwapInfo(state)
  const { onSelectCurrency, onHideTokenSelector } = useSwapActionHandlers(dispatch)
  const { selectingCurrencyField, currencies } = derivedSwapInfo

  // keep currencies list option as state so that rendered list remains stable through the slide animation
  const [listVariation, setListVariation] = useState<TokenSelectorVariation>(
    TokenSelectorVariation.BalancesAndPopular
  )

  // use initial content height only to determine native keyboard view
  // because show/hiding the custom keyboard will change the content height
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)

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

  const screenXOffset = useSharedValue(0)

  useEffect(() => {
    if (selectingCurrencyField) {
      setListVariation(
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.BalancesAndPopular
          : TokenSelectorVariation.SuggestedAndPopular
      )
    }

    const screenOffset = selectingCurrencyField !== undefined ? 1 : 0
    screenXOffset.value = withSpring(-(dimensions.fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, selectingCurrencyField])

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
    <TouchableWithoutFeedback onPress={onBackgroundPress}>
      <AnimatedFlex grow row flex={1} gap="none" py="md" style={wrapperStyle}>
        <Flex grow gap="xs" width="100%" onLayout={onLayout}>
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
        {selectingCurrencyField ? (
          <TokenSelector
            otherCurrency={
              selectingCurrencyField
                ? currencies[otherCurrencyField(selectingCurrencyField)]
                : undefined
            }
            selectedCurrency={
              selectingCurrencyField ? currencies[selectingCurrencyField] : undefined
            }
            variation={listVariation}
            onBack={onHideTokenSelector}
            onSelectCurrency={(currency: Currency) =>
              selectingCurrencyField && onSelectCurrency(selectingCurrencyField, currency)
            }
          />
        ) : null}
      </AnimatedFlex>
    </TouchableWithoutFeedback>
  )
}

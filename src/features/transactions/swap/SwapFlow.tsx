import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React, { Dispatch, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TokenSelectorVariation } from 'src/components/TokenSelector/SearchResults'
import { TokenSelect } from 'src/components/TokenSelector/TokenSelect'
import { WarningAction, WarningModalType } from 'src/components/warnings/types'
import { WarningModal } from 'src/components/warnings/WarningModal'
import {
  DerivedSwapInfo,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapCallbackFromDerivedSwapInfo,
} from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateActions,
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

  // keep currencies list option as state so that rendered list remains stable through the slide animation
  const [listVariation, setListVariation] = useState<TokenSelectorVariation>(
    TokenSelectorVariation.BalancesAndPopular
  )
  const { swapCallback } = useSwapCallbackFromDerivedSwapInfo(derivedSwapInfo)
  const { warningModalType, warnings, selectingCurrencyField, currencies } = derivedSwapInfo

  // use initial content height only to determine native keyboard view
  // because show/hiding the custom keyboard will change the content height
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)

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
          <WarningModal
            cancelLabel={t('Cancel swap')}
            continueLabel={t('Swap anyway')}
            warning={warning}
            warningModalType={warningModalType}
            onClose={() => dispatch(transactionStateActions.closeWarningModal())}
            onPressContinue={
              derivedSwapInfo.warningModalType === WarningModalType.ACTION
                ? swapCallback
                : undefined
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
        {selectingCurrencyField ? (
          <TokenSelect
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

import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React, { Dispatch, useEffect, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, TouchableWithoutFeedback } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { CurrencySelect } from 'src/components/CurrencySelector/CurrencySelect'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { WarningAction, WarningModalType } from 'src/components/warnings/types'
import { WarningModal } from 'src/components/warnings/WarningModal'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import {
  DerivedSwapInfo,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapCallbackFromDerivedSwapInfo,
} from 'src/features/transactions/swap/hooks'
import { SwapForm } from 'src/features/transactions/swap/SwapForm'
import { SwapReview } from 'src/features/transactions/swap/SwapReview'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { ANIMATE_SPRING_CONFIG } from 'src/features/transactions/utils'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateActions,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { dimensions } from 'src/styles/sizing'
import { flattenObjectOfObjects } from 'src/utils/objects'

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
  const { onSelectCurrency } = useSwapActionHandlers(dispatch)

  // keep currencies list as state so that it remains stable through the slide animation
  const [selectableCurrencies, setSelectableCurrencies] = useState<Currency[]>([])
  const { swapCallback } = useSwapCallbackFromDerivedSwapInfo(derivedSwapInfo)
  const { warningModalType, warnings, selectingCurrencyField, currencies } = derivedSwapInfo

  const chainIds = useActiveChainIds()
  const activeAccount = useActiveAccount()
  const currenciesByChain = useAllCurrencies()
  const balances = useAllBalancesByChainId(activeAccount?.address, chainIds)
  const currenciesWithBalances = useMemo(
    () => flattenObjectOfObjects(balances.balances).map((b) => b.amount.currency),
    [balances.balances]
  )
  const allCurrencies = useMemo(
    () => flattenObjectOfObjects(currenciesByChain),
    [currenciesByChain]
  )

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
    if (selectingCurrencyField !== undefined) {
      setSelectableCurrencies(
        selectingCurrencyField === CurrencyField.INPUT ? currenciesWithBalances : allCurrencies
      )
    }

    const screenOffset = selectingCurrencyField !== undefined ? 1 : 0
    screenXOffset.value = withSpring(-(dimensions.fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)

    // TODO: fix currenciesWithBalances being different on every render, until then:
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <AnimatedFlex grow row flex={1} gap="none" style={wrapperStyle}>
        <Flex grow gap="xs" py="xs" width="100%" onLayout={onLayout}>
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
        <CurrencySelect
          currencies={selectableCurrencies}
          otherCurrency={
            selectingCurrencyField !== undefined
              ? currencies[otherCurrencyField(selectingCurrencyField)]
              : undefined
          }
          selectedCurrency={
            selectingCurrencyField !== undefined ? currencies[selectingCurrencyField] : undefined
          }
          showNonZeroBalancesOnly={selectingCurrencyField === CurrencyField.INPUT}
          onSelectCurrency={(currency: Currency) =>
            selectingCurrencyField !== undefined &&
            onSelectCurrency(selectingCurrencyField, currency)
          }
        />
      </AnimatedFlex>
    </TouchableWithoutFeedback>
  )
}

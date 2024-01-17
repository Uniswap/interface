import React, { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import {
  SwapFormContextProvider,
  SwapFormState,
} from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import {
  SwapScreen,
  SwapScreenContextProvider,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import {
  SwapTxContextProviderLegacyApi,
  SwapTxContextProviderTradingApi,
} from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { useOnCloseSwapModal } from 'src/features/transactions/swapRewrite/hooks/useOnCloseSwapModal'
import { SwapFormButton } from 'src/features/transactions/swapRewrite/SwapFormButton'
import { SwapFormScreen } from 'src/features/transactions/swapRewrite/SwapFormScreen'
import { SwapReviewScreen } from 'src/features/transactions/swapRewrite/SwapReviewScreen'
import {
  TransactionModal,
  TransactionModalFooterContainer,
} from 'src/features/transactions/swapRewrite/TransactionModal'
import { getFocusOnCurrencyFieldFromInitialState } from 'src/features/transactions/swapRewrite/utils'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'

export function SwapFlow(): JSX.Element {
  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SwapScreenContextProvider` needs to be inside the `BottomSheetModal`'s `Container`.
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const fullscreen = screen === SwapScreen.SwapForm

  const showStickyReviewButton =
    screen === SwapScreen.SwapForm || screen === SwapScreen.SwapReviewHoldingToSwap

  const onCloseSwapModal = useOnCloseSwapModal()

  return (
    <TransactionModal fullscreen={fullscreen} modalName={ModalName.Swap} onClose={onCloseSwapModal}>
      <SwapContextsContainer>
        <CurrentScreen screen={screen} setScreen={setScreen} />
        {/*
        We render the `Review` button here instead of doing it inside `SwapFormScreen` so that it stays in place when the user is "holding to swap".
      */}
        {showStickyReviewButton && (
          <TransactionModalFooterContainer>
            <SwapFormButton />
          </TransactionModalFooterContainer>
        )}
      </SwapContextsContainer>
    </TransactionModal>
  )
}

function CurrentScreen({
  screen,
  setScreen,
}: {
  screen: SwapScreen
  setScreen: Dispatch<SetStateAction<SwapScreen>>
}): JSX.Element {
  const { screen: contextScreen, screenRef: contextScreenRef } = useSwapScreenContext()

  useEffect(() => {
    setScreen(contextScreen)
  }, [contextScreen, contextScreenRef, setScreen])

  switch (screen) {
    case SwapScreen.SwapForm:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreenDelayedRender />
        </Trace>
      )
    case SwapScreen.SwapReview:
    case SwapScreen.SwapReviewHoldingToSwap:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreenDelayedRender />
        </Trace>
      )
    default:
      throw new Error(`Unknown screen: ${screen}`)
  }
}

// We add a short hardcoded delay to allow the sheet to animate quickly both on first render and when going back from Review -> Form.
function SwapFormScreenDelayedRender(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapFormScreen hideContent={hideContent} />
}

// We add a short hardcoded delay to allow the sheet to animate quickly when going from Form -> Review.
function SwapReviewScreenDelayedRender(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapReviewScreen hideContent={hideContent} />
}

function SwapContextsContainer({ children }: { children?: ReactNode }): JSX.Element {
  const onCloseSwapModal = useOnCloseSwapModal()
  const { initialState } = useAppSelector(selectModalState(ModalName.Swap))

  const prefilledState = useMemo(
    (): SwapFormState | undefined =>
      initialState
        ? {
            customSlippageTolerance: initialState.customSlippageTolerance,
            exactAmountFiat: initialState.exactAmountFiat,
            exactAmountToken: initialState.exactAmountToken,
            exactCurrencyField: initialState.exactCurrencyField,
            focusOnCurrencyField: getFocusOnCurrencyFieldFromInitialState(initialState),
            input: initialState.input ?? undefined,
            output: initialState.output ?? undefined,
            selectingCurrencyField: initialState.selectingCurrencyField,
            txId: initialState.txId,
            isFiatMode: false,
            isSubmitting: false,
          }
        : undefined,
    [initialState]
  )

  // conditionally render a different provider based on the active api gate. Each uses different hooks for data fetching.
  const isTradingApiEnabled = useFeatureFlag(FEATURE_FLAGS.TradingApi)
  const SwapTxContextProviderWrapper = isTradingApiEnabled
    ? SwapTxContextProviderTradingApi
    : SwapTxContextProviderLegacyApi

  return (
    <SwapScreenContextProvider>
      <SwapFormContextProvider prefilledState={prefilledState} onClose={onCloseSwapModal}>
        <SwapTxContextProviderWrapper>{children}</SwapTxContextProviderWrapper>
      </SwapFormContextProvider>
    </SwapScreenContextProvider>
  )
}

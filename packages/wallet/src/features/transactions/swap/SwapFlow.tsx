import React, { Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import {
  SwapFormContextProvider,
  SwapFormState,
} from 'wallet/src/features/transactions/contexts/SwapFormContext'
import {
  SwapScreen,
  SwapScreenContextProvider,
  useSwapScreenContext,
} from 'wallet/src/features/transactions/contexts/SwapScreenContext'
import {
  SwapTxContextProviderLegacyApi,
  SwapTxContextProviderTradingApi,
} from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { SwapFormButton } from 'wallet/src/features/transactions/swap/SwapFormButton'
import { SwapFormScreen } from 'wallet/src/features/transactions/swap/SwapFormScreen'
import { SwapReviewScreen } from 'wallet/src/features/transactions/swap/SwapReviewScreen'
import {
  TransactionModal,
  TransactionModalFooterContainer,
} from 'wallet/src/features/transactions/swap/TransactionModal'
import { TransactionModalProps } from 'wallet/src/features/transactions/swap/TransactionModalProps'
import { ModalName, SectionName } from 'wallet/src/telemetry/constants'

export function SwapFlow({
  prefilledState,
  TokenSelector,
  ...transactionModalProps
}: {
  prefilledState?: SwapFormState
  onClose: () => void
  // TODO(felipe): This is a temporary prop to allow us to move this flow screen-by-screen into the shared wallet package + extension.
  //               In a future PR we'll move the `TokenSelector` component (and its dependencies) into the shared wallet package.
  TokenSelector: React.FC
} & Omit<TransactionModalProps, 'fullscreen' | 'modalName'>): JSX.Element {
  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SwapScreenContextProvider` needs to be inside the `BottomSheetModal`'s `Container`.
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const fullscreen = screen === SwapScreen.SwapForm

  const showStickyReviewButton =
    screen === SwapScreen.SwapForm || screen === SwapScreen.SwapReviewHoldingToSwap

  return (
    <TransactionModal fullscreen={fullscreen} modalName={ModalName.Swap} {...transactionModalProps}>
      <SwapContextsContainer prefilledState={prefilledState}>
        <CurrentScreen TokenSelector={TokenSelector} screen={screen} setScreen={setScreen} />
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
  TokenSelector,
}: {
  screen: SwapScreen
  setScreen: Dispatch<SetStateAction<SwapScreen>>
  TokenSelector: React.FC
}): JSX.Element {
  const { screen: contextScreen, screenRef: contextScreenRef } = useSwapScreenContext()

  useEffect(() => {
    setScreen(contextScreen)
  }, [contextScreen, contextScreenRef, setScreen])

  switch (screen) {
    case SwapScreen.SwapForm:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreenDelayedRender TokenSelector={TokenSelector} />
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
function SwapFormScreenDelayedRender({ TokenSelector }: { TokenSelector: React.FC }): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapFormScreen TokenSelector={TokenSelector} hideContent={hideContent} />
}

// We add a short hardcoded delay to allow the sheet to animate quickly when going from Form -> Review.
function SwapReviewScreenDelayedRender(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapReviewScreen hideContent={hideContent} />
}

function SwapContextsContainer({
  prefilledState,
  children,
}: {
  prefilledState: SwapFormState | undefined
  children?: ReactNode
}): JSX.Element {
  // conditionally render a different provider based on the active api gate. Each uses different hooks for data fetching.
  const isTradingApiEnabled = useFeatureFlag(FEATURE_FLAGS.TradingApi)
  const SwapTxContextProviderWrapper = isTradingApiEnabled
    ? SwapTxContextProviderTradingApi
    : SwapTxContextProviderLegacyApi

  return (
    <SwapScreenContextProvider>
      <SwapFormContextProvider prefilledState={prefilledState}>
        <SwapTxContextProviderWrapper>{children}</SwapTxContextProviderWrapper>
      </SwapFormContextProvider>
    </SwapScreenContextProvider>
  )
}

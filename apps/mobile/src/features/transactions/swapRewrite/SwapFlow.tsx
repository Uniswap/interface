import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { SectionName } from 'src/features/telemetry/constants'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import {
  SwapBottomSheetModal,
  SwapBottomSheetModalFooterContainer,
} from 'src/features/transactions/swapRewrite/SwapBottomSheetModal'
import { SwapFormButton } from 'src/features/transactions/swapRewrite/SwapFormButton'
import { SwapFormScreen } from 'src/features/transactions/swapRewrite/SwapFormScreen'
import { SwapReviewScreen } from 'src/features/transactions/swapRewrite/SwapReviewScreen'
import { Trace } from 'utilities/src/telemetry/trace/Trace'

export function SwapFlow(): JSX.Element {
  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SwapScreenContextProvider` needs to be inside the `BottomSheetModal`'s `Container`.
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const fullscreen = screen === SwapScreen.SwapForm

  const showStickyReviewButton =
    screen === SwapScreen.SwapForm || screen === SwapScreen.SwapReviewHoldingToSwap

  return (
    <SwapBottomSheetModal fullscreen={fullscreen}>
      <CurrentScreen screen={screen} setScreen={setScreen} />

      {/*
        We render the `Review` button here instead of doing it inside `SwapFormScreen` so that it stays in place when the user is "holding to swap".
      */}
      {showStickyReviewButton && (
        <SwapBottomSheetModalFooterContainer>
          <SwapFormButton />
        </SwapBottomSheetModalFooterContainer>
      )}
    </SwapBottomSheetModal>
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

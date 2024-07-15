import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { isWeb } from 'ui/src'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { SwapFormContextProvider, SwapFormState } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import {
  SwapScreen,
  SwapScreenContextProvider,
  useSwapScreenContext,
} from 'wallet/src/features/transactions/contexts/SwapScreenContext'
import { SwapTxContextProviderTradingApi } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { SwapFormButton } from 'wallet/src/features/transactions/swap/SwapFormButton'
import { SwapFormScreen } from 'wallet/src/features/transactions/swap/SwapFormScreen'
import { SwapReviewScreen } from 'wallet/src/features/transactions/swap/SwapReviewScreen'
import {
  TransactionModal,
  TransactionModalFooterContainer,
} from 'wallet/src/features/transactions/swap/TransactionModal'
import { TransactionModalProps } from 'wallet/src/features/transactions/swap/TransactionModalProps'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/trade/api/client'

export function SwapFlow({
  prefilledState,
  ...transactionModalProps
}: {
  prefilledState?: SwapFormState
  onClose: () => void
} & Omit<TransactionModalProps, 'fullscreen' | 'modalName'>): JSX.Element {
  // We reset the cache every time the swap flow reopens to avoid old quotes persisting between retries after a failed transaction.
  useResetTradingApiCacheOnMount()

  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SwapScreenContextProvider` needs to be inside the `BottomSheetModal`'s `Container`.
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const fullscreen = screen === SwapScreen.SwapForm

  const showStickyReviewButton =
    !isWeb && (screen === SwapScreen.SwapForm || screen === SwapScreen.SwapReviewHoldingToSwap)

  return (
    <TransactionModal fullscreen={fullscreen} modalName={ModalName.Swap} {...transactionModalProps}>
      <SwapScreenContextProvider>
        <SwapFormContextProvider prefilledState={prefilledState}>
          <SwapTxContextProviderTradingApi>
            <CurrentScreen screen={screen} setScreen={setScreen} />
            {/*
              We render the `Review` button here instead of doing it inside `SwapFormScreen` so that it stays in place when the user is "holding to swap".
            */}
            {showStickyReviewButton && (
              <TransactionModalFooterContainer>
                <SwapFormButton />
              </TransactionModalFooterContainer>
            )}
          </SwapTxContextProviderTradingApi>
        </SwapFormContextProvider>
      </SwapScreenContextProvider>
    </TransactionModal>
  )
}

function useResetTradingApiCacheOnMount(): void {
  useEffect(() => {
    TradingApiApolloClient.resetStore().catch((error) => {
      logger.error(error, {
        tags: { file: 'SwapFlow.tsx', function: 'TradingApiApolloClient.resetStore' },
      })
    })
  }, [])
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

  if (isWeb) {
    switch (screen) {
      case SwapScreen.SwapForm:
      case SwapScreen.SwapReview:
        return (
          <>
            <Trace logImpression section={SectionName.SwapForm}>
              <SwapFormScreen hideContent={false} />
            </Trace>

            {/*
              We want to render the `BottomSheetModal` from the start to allow the tamagui animation to happen once we switch the `isModalOpen` prop to `true`.
              We only render `SwapReviewScreen` once the user is truly on that step though.
            */}
            <BottomSheetModal
              alignment="top"
              isModalOpen={screen === SwapScreen.SwapReview}
              name={ModalName.SwapReview}
            >
              <Trace logImpression section={SectionName.SwapReview}>
                <SwapReviewScreen hideContent={false} />
              </Trace>
            </BottomSheetModal>
          </>
        )
      default:
        throw new Error(`Unknown screen: ${screen}`)
    }
  }

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

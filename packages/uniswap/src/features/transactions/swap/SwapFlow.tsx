import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { isWeb } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionModal,
  TransactionModalFooterContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { TransactionModalProps } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalProps'
import { SwapFormContextProvider, SwapFormState } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import {
  SwapScreen,
  SwapScreenContextProvider,
  useSwapScreenContext,
} from 'uniswap/src/features/transactions/swap/contexts/SwapScreenContext'
import { SwapTxContextProviderTradingApi } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SwapFormButton } from 'uniswap/src/features/transactions/swap/form/SwapFormButton'
import { SwapFormScreen } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen'
import { SwapReviewScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'

export interface SwapFlowProps extends Omit<TransactionModalProps, 'fullscreen' | 'modalName'> {
  prefilledState?: SwapFormState
  customSettings?: SwapSettingConfig[]
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}

export function SwapFlow({
  prefilledState,
  customSettings = [],
  swapCallback,
  wrapCallback,
  ...transactionModalProps
}: SwapFlowProps): JSX.Element {
  // We need this additional `screen` state outside of the `SwapScreenContext` because the `SwapScreenContextProvider` needs to be inside the `Modal`'s `Container`.
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const fullscreen = screen === SwapScreen.SwapForm

  const showStickyReviewButton = !isWeb && screen === SwapScreen.SwapForm

  return (
    <TransactionModal fullscreen={fullscreen} modalName={ModalName.Swap} {...transactionModalProps}>
      <SwapScreenContextProvider>
        <SwapFormContextProvider prefilledState={prefilledState}>
          <SwapTxContextProviderTradingApi>
            <CurrentScreen
              customSettings={customSettings}
              screen={screen}
              setScreen={setScreen}
              swapCallback={swapCallback}
              wrapCallback={wrapCallback}
            />
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

function CurrentScreen({
  screen,
  setScreen,
  customSettings,
  swapCallback,
  wrapCallback,
}: {
  screen: SwapScreen
  setScreen: Dispatch<SetStateAction<SwapScreen>>
  customSettings: SwapSettingConfig[]
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}): JSX.Element {
  const { screen: contextScreen, screenRef: contextScreenRef } = useSwapScreenContext()

  useEffect(() => {
    setScreen(contextScreen)
  }, [contextScreen, contextScreenRef, setScreen])

  if (isWeb) {
    return (
      <>
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreen customSettings={customSettings} hideContent={false} />
        </Trace>

        {/*
              We want to render the `Modal` from the start to allow the tamagui animation to happen once we switch the `isModalOpen` prop to `true`.
              We only render `SwapReviewScreen` once the user is truly on that step though.
            */}
        <Modal alignment="top" isModalOpen={screen === SwapScreen.SwapReview} name={ModalName.SwapReview}>
          <Trace logImpression section={SectionName.SwapReview}>
            <SwapReviewScreen hideContent={false} swapCallback={swapCallback} wrapCallback={wrapCallback} />
          </Trace>
        </Modal>
      </>
    )
  }

  switch (screen) {
    case SwapScreen.SwapForm:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreenDelayedRender customSettings={customSettings} />
        </Trace>
      )
    case SwapScreen.SwapReview:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreenDelayedRender swapCallback={swapCallback} wrapCallback={wrapCallback} />
        </Trace>
      )
  }
}

// We add a short hardcoded delay to allow the sheet to animate quickly both on first render and when going back from Review -> Form.
function SwapFormScreenDelayedRender({ customSettings }: { customSettings: SwapSettingConfig[] }): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapFormScreen customSettings={customSettings} hideContent={hideContent} />
}

// We add a short hardcoded delay to allow the sheet to animate quickly when going from Form -> Review.
function SwapReviewScreenDelayedRender({
  swapCallback,
  wrapCallback,
}: {
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}): JSX.Element {
  const [hideContent, setHideContent] = useState(true)

  useEffect(() => {
    setTimeout(() => setHideContent(false), 25)
  }, [])

  return <SwapReviewScreen hideContent={hideContent} swapCallback={swapCallback} wrapCallback={wrapCallback} />
}

import { useEffect, useState } from 'react'
import { isWeb } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionModal,
  TransactionModalFooterContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionModalProps } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalProps'
import {
  TransactionSettingsContext,
  useTransactionSettingsContext,
} from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import {
  SwapFormContext,
  SwapFormState,
  useSwapFormContext,
} from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapTxContextProviderTradingApi } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SwapFormButton } from 'uniswap/src/features/transactions/swap/form/SwapFormButton'
import { SwapFormScreen } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen'
import { SwapReviewScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isInterface } from 'utilities/src/platform'

export interface SwapFlowProps extends Omit<TransactionModalProps, 'fullscreen' | 'modalName'> {
  prefilledState?: SwapFormState
  settings: SwapSettingConfig[]
  hideHeader?: boolean
  hideFooter?: boolean
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
  onSubmitSwap?: () => Promise<void>
  tokenColor?: string
}

export function SwapFlow({
  settings,
  swapCallback,
  wrapCallback,
  onSubmitSwap,
  tokenColor,
  ...transactionModalProps
}: SwapFlowProps): JSX.Element {
  const swapFormContext = useSwapFormContext()
  const transactionSettingsContext = useTransactionSettingsContext()
  return (
    <TransactionModal modalName={ModalName.Swap} {...transactionModalProps}>
      {/* Re-create the TransactionSettingsContextProvider, since native Modal can cause its children to be in a separate component tree. */}
      <TransactionSettingsContext.Provider value={transactionSettingsContext}>
        {/* Re-create the SwapFormContextProvider, since native Modal can cause its children to be in a separate component tree. */}
        <SwapFormContext.Provider value={swapFormContext}>
          <SwapTxContextProviderTradingApi>
            <CurrentScreen
              settings={settings}
              swapCallback={swapCallback}
              wrapCallback={wrapCallback}
              tokenColor={tokenColor}
              onSubmitSwap={onSubmitSwap}
            />
          </SwapTxContextProviderTradingApi>
        </SwapFormContext.Provider>
      </TransactionSettingsContext.Provider>
    </TransactionModal>
  )
}

function CurrentScreen({
  settings,
  swapCallback,
  wrapCallback,
  onSubmitSwap,
  tokenColor,
}: {
  settings: SwapSettingConfig[]
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
  onSubmitSwap?: () => Promise<void>
  tokenColor?: string
}): JSX.Element {
  const { screen, setScreen } = useTransactionModalContext()

  if (isWeb) {
    return (
      <>
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreen settings={settings} hideContent={false} wrapCallback={wrapCallback} tokenColor={tokenColor} />
        </Trace>

        {/*
          We want to render the `Modal` from the start to allow the tamagui animation to happen once we switch the `isModalOpen` prop to `true`.
          We only render `SwapReviewScreen` once the user is truly on that step though.
        */}
        <Modal
          height="auto"
          alignment={isInterface ? 'center' : 'top'}
          isModalOpen={screen === TransactionScreen.Review}
          name={ModalName.SwapReview}
          padding="$spacing12"
          onClose={() => setScreen(TransactionScreen.Form)}
        >
          <Trace logImpression section={SectionName.SwapReview}>
            <SwapReviewScreen hideContent={false} swapCallback={swapCallback} wrapCallback={wrapCallback} />
          </Trace>
        </Modal>
      </>
    )
  }

  switch (screen) {
    case TransactionScreen.Form:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreenDelayedRender settings={settings} />
          <TransactionModalFooterContainer>
            <SwapFormButton />
          </TransactionModalFooterContainer>
        </Trace>
      )
    case TransactionScreen.Review:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreenDelayedRender
            swapCallback={swapCallback}
            wrapCallback={wrapCallback}
            onSubmitSwap={onSubmitSwap}
          />
        </Trace>
      )
  }
}

// Please verify this on both an Android and iOS physical device before changing these values.
const SWAP_FORM_SCREEN_TRANSITION_DELAY = isWeb ? 0 : 25
const SWAP_REVIEW_SCREEN_TRANSITION_DELAY = isWeb ? 0 : 450

// We add a short hardcoded delay to allow the sheet to animate quickly both on first render and when going back from Review -> Form.
function SwapFormScreenDelayedRender({ settings }: { settings: SwapSettingConfig[] }): JSX.Element {
  const [hideContent, setHideContent] = useState(SWAP_FORM_SCREEN_TRANSITION_DELAY > 0)

  useEffect(() => {
    setTimeout(() => setHideContent(false), SWAP_FORM_SCREEN_TRANSITION_DELAY)
  }, [])

  return <SwapFormScreen settings={settings} hideContent={hideContent} />
}

// We add a short hardcoded delay to allow the sheet to animate quickly when going from Form -> Review.
function SwapReviewScreenDelayedRender({
  swapCallback,
  wrapCallback,
  onSubmitSwap,
}: {
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
  onSubmitSwap?: () => Promise<void>
}): JSX.Element {
  const [hideContent, setHideContent] = useState(SWAP_REVIEW_SCREEN_TRANSITION_DELAY > 0)

  useEffect(() => {
    setTimeout(() => setHideContent(false), SWAP_REVIEW_SCREEN_TRANSITION_DELAY)
  }, [])

  return (
    <SwapReviewScreen
      hideContent={hideContent}
      swapCallback={swapCallback}
      wrapCallback={wrapCallback}
      onSubmitSwap={onSubmitSwap}
    />
  )
}

import { useFocusEffect } from '@react-navigation/core'
import { useState } from 'react'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SwapFormScreen } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreen'
import { SwapFormWarningModals } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormWarningModals'
import { SwapFormButton } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/SwapFormButton'
import { SwapFormWarningStateProvider } from 'uniswap/src/features/transactions/swap/form/context/SwapFormWarningStateContextProvider'
import type { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'
import { SwapReviewScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewScreen'
import { useEvent } from 'utilities/src/react/hooks'
import { useTimeout } from 'utilities/src/time/timing'

export function CurrentScreen({
  settings,
  onSubmitSwap,
}: {
  settings: SwapSettingConfig[]
  onSubmitSwap?: () => Promise<void>
  tokenColor?: string
}): JSX.Element {
  const { screen } = useTransactionModalContext()

  switch (screen) {
    case TransactionScreen.Form:
      return (
        <Trace logImpression section={SectionName.SwapForm}>
          <SwapFormScreenDelayedRender settings={settings} />
          <TransactionModalFooterContainer>
            <SwapFormWarningStateProvider>
              <SwapFormButton />
              <SwapFormWarningModals />
            </SwapFormWarningStateProvider>
          </TransactionModalFooterContainer>
        </Trace>
      )
    case TransactionScreen.Review:
      return (
        <Trace logImpression section={SectionName.SwapReview}>
          <SwapReviewScreenDelayedRender onSubmitSwap={onSubmitSwap} />
        </Trace>
      )
  }
}

// Please verify this on both an Android and iOS physical device before changing these values.
const SWAP_FORM_SCREEN_TRANSITION_DELAY = 25
const SWAP_REVIEW_SCREEN_TRANSITION_DELAY = 450

// We add a short hardcoded delay to allow the sheet to animate quickly both on first render and when going back from Review -> Form.
function SwapFormScreenDelayedRender({ settings }: { settings: SwapSettingConfig[] }): JSX.Element {
  const { isContentHidden } = useDelayedRender(SWAP_FORM_SCREEN_TRANSITION_DELAY)

  return <SwapFormScreen settings={settings} hideContent={isContentHidden} focusHook={useFocusEffect} />
}

// We add a short hardcoded delay to allow the sheet to animate quickly when going from Form -> Review.
function SwapReviewScreenDelayedRender({ onSubmitSwap }: { onSubmitSwap?: () => Promise<void> }): JSX.Element {
  const { isContentHidden } = useDelayedRender(SWAP_REVIEW_SCREEN_TRANSITION_DELAY)

  return <SwapReviewScreen hideContent={isContentHidden} onSubmitSwap={onSubmitSwap} />
}

function useDelayedRender(delay: number): { isContentHidden: boolean } {
  const [isContentHidden, setIsContentHidden] = useState(true)
  const setVisible = useEvent(() => setIsContentHidden(false))
  useTimeout(setVisible, delay)

  return { isContentHidden }
}
